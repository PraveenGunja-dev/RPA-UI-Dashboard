"""
SharePoint Service using Microsoft Graph API.
Migrated from office365-rest-python-client (which was returning 401 Unauthorized)
to msal + requests for Graph API access.
"""

import os
import tempfile
import re
import time
import ssl
import urllib.parse
from datetime import datetime
from pathlib import Path

import requests
import msal
import urllib3
from dotenv import load_dotenv

# =============================================================================
# DISABLE SSL VERIFICATION (Required for Corporate Proxy/Environment)
# =============================================================================
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
ssl._create_default_https_context = ssl._create_unverified_context
# =============================================================================

# Load .env from the backend directory
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

# Configuration from environment variables
SHAREPOINT_CLIENT_ID = os.getenv("SHAREPOINT_CLIENT_ID")
SHAREPOINT_CLIENT_SECRET = os.getenv("SHAREPOINT_CLIENT_SECRET")
SHAREPOINT_TENANT_ID = os.getenv("SHAREPOINT_TENANT_ID")
SHAREPOINT_SITE_URL = os.getenv("SHAREPOINT_SITE_URL", "https://adaniltd.sharepoint.com/sites/AGEL-Automation")
SHAREPOINT_TARGET_FOLDER = os.getenv("SHAREPOINT_TARGET_FOLDER", "/sites/AGEL-Automation/Shared Documents/Bots/Agent Dashboard")


def _resolve_ssl_verify():
    """Determine SSL verification setting from environment."""
    proxy_insecure = os.getenv("PROXY_INSECURE_SSL", "false").lower() in ("true", "1", "yes", "on")
    if proxy_insecure:
        return False
    val = os.getenv("SHAREPOINT_SSL_VERIFY", "false").strip()
    if val.lower() in ("false", "0", "no", "off"):
        return False
    if val.lower() in ("true", "1", "yes", "on"):
        return True
    return val


class SharePointService:
    """SharePoint service using Microsoft Graph API for file access."""

    def __init__(self):
        self.site_url = SHAREPOINT_SITE_URL
        self.client_id = SHAREPOINT_CLIENT_ID
        self.client_secret = SHAREPOINT_CLIENT_SECRET
        self.tenant_id = SHAREPOINT_TENANT_ID
        self.folder_path = SHAREPOINT_TARGET_FOLDER

        self.token = None
        self.site_id = None

        # Configure session
        self.session = requests.Session()
        self.session.verify = _resolve_ssl_verify()

        # Proxy support
        proxy_enabled = os.getenv("PROXY_ENABLED", "false").lower() in ("true", "1", "yes", "on")
        proxy_url = os.getenv("PROXY_URL")
        if proxy_enabled and proxy_url:
            self.session.proxies = {"http": proxy_url, "https": proxy_url}

        # Authenticate on init
        self._authenticate()

    def _authenticate(self):
        """Authenticate with Microsoft Graph API using Client Credentials."""
        if not self.client_id or not self.client_secret:
            raise Exception(
                "SharePoint credentials not configured. "
                "Set SHAREPOINT_CLIENT_ID and SHAREPOINT_CLIENT_SECRET in .env"
            )

        try:
            authority = f"https://login.microsoftonline.com/{self.tenant_id or 'common'}"
            scopes = ["https://graph.microsoft.com/.default"]

            app = msal.ConfidentialClientApplication(
                self.client_id,
                authority=authority,
                client_credential=self.client_secret,
                http_client=self.session
            )

            result = app.acquire_token_for_client(scopes=scopes)

            if "access_token" in result:
                self.token = result["access_token"]
                self.site_id = self._get_site_id()
                print("SharePoint: Connected via Microsoft Graph API (Client Credentials)")
            else:
                error_desc = result.get('error_description', 'Unknown error')
                raise Exception(f"Failed to acquire token: {error_desc}")

        except Exception as e:
            raise Exception(f"Failed to authenticate with SharePoint: {str(e)}")

    def _get_site_id(self):
        """Resolve the SharePoint site ID from the site URL."""
        parsed_url = urllib.parse.urlparse(self.site_url)
        hostname = parsed_url.netloc
        relative_path = parsed_url.path.rstrip("/")

        headers = {"Authorization": f"Bearer {self.token}"}
        url = f"https://graph.microsoft.com/v1.0/sites/{hostname}:{relative_path}"

        response = self.session.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Failed to resolve site ID: {response.status_code} - {response.text}")
        return response.json().get("id")

    def _retry_call(self, func, max_retries=3, base_delay=5):
        """Execute a function with retry logic for transient SharePoint errors."""
        for attempt in range(max_retries + 1):
            try:
                return func()
            except Exception as e:
                error_str = str(e)
                is_transient = any(code in error_str for code in [
                    '503', '504', '429', 'Service Unavailable', 'Gateway Timeout'
                ])
                if is_transient and attempt < max_retries:
                    wait_time = base_delay * (2 ** attempt)
                    print(f"SharePoint transient error (attempt {attempt + 1}/{max_retries}): "
                          f"{error_str}. Retrying after {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise

    def _resolve_drive_and_path(self, folder_path):
        """Resolve the drive ID and relative path within the drive."""
        site_path = urllib.parse.urlparse(self.site_url).path.rstrip("/")
        if folder_path.startswith(site_path):
            folder_path = folder_path[len(site_path):]
        folder_path = folder_path.strip("/")

        parts = [p for p in folder_path.split("/") if p]
        drive_name = parts[0] if parts else "Shared Documents"
        folder_path_in_drive = "/".join(parts[1:]) if parts else ""

        headers = {"Authorization": f"Bearer {self.token}"}
        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drives"
        response = self.session.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Failed to list drives: {response.status_code} - {response.text}")

        drives = response.json().get("value", [])
        drive_id = None
        for d in drives:
            name = d.get("name")
            if (name == drive_name or
                (drive_name == "Shared Documents" and name == "Documents") or
                (drive_name == "Documents" and name == "Shared Documents")):
                drive_id = d.get("id")
                break

        if not drive_id:
            default_res = self.session.get(
                f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drive",
                headers=headers
            )
            if default_res.status_code == 200:
                drive_id = default_res.json().get("id")
            else:
                raise Exception(f"Failed to resolve default drive: {default_res.text}")

        return drive_id, folder_path_in_drive

    def _get_graph_url_for_path(self, folder_path, endpoint="children"):
        """Build Graph API URL for a given folder path and endpoint."""
        drive_id, rel_path = self._resolve_drive_and_path(folder_path)
        encoded_path = "/".join([urllib.parse.quote(s) for s in rel_path.split("/") if s])
        if encoded_path:
            return (f"https://graph.microsoft.com/v1.0/sites/{self.site_id}"
                    f"/drives/{drive_id}/root:/{encoded_path}:/{endpoint}"), drive_id
        else:
            if endpoint == "children":
                return (f"https://graph.microsoft.com/v1.0/sites/{self.site_id}"
                        f"/drives/{drive_id}/root/children"), drive_id
            else:
                return (f"https://graph.microsoft.com/v1.0/sites/{self.site_id}"
                        f"/drives/{drive_id}/root"), drive_id

    def list_files(self):
        """
        List files in the target folder.
        Returns list of dicts with 'Name', 'ServerRelativeUrl', 'TimeLastModified'
        to maintain backward compatibility with the old office365 API.
        """
        def _do_list_files():
            url, _ = self._get_graph_url_for_path(self.folder_path, "children")
            headers = {"Authorization": f"Bearer {self.token}"}

            all_items = []
            page_url = url

            while page_url:
                response = self.session.get(page_url, headers=headers)
                if response.status_code != 200:
                    raise Exception(f"Failed to list files: {response.status_code} - {response.text}")

                res_json = response.json()
                all_items.extend(res_json.get('value', []))
                page_url = res_json.get('@odata.nextLink')

            # Build result in the same format as the old service
            file_list = []
            for item in all_items:
                if 'file' in item:
                    file_list.append({
                        "Name": item.get("name"),
                        "ServerRelativeUrl": f"{self.folder_path}/{item.get('name')}",
                        "TimeLastModified": item.get("lastModifiedDateTime", "")
                    })

            return file_list

        return self._retry_call(_do_list_files)

    def download_latest_dump(self, save_dir: str = None) -> str:
        """
        Finds the latest Control Room Dump file and downloads it.
        Returns the path to the downloaded file.
        """
        files = self.list_files()

        # Filter for "dump" files or "status report"
        dump_files = [
            f for f in files
            if ("dump" in f["Name"].lower() or
                "control room" in f["Name"].lower() or
                "status report" in f["Name"].lower())
            and f["Name"].endswith(".xlsx")
        ]

        if not dump_files:
            raise FileNotFoundError("No 'Control Room Dump' Excel files found in the target folder.")

        # Sort by modification time (descending)
        dump_files.sort(key=lambda x: x["TimeLastModified"], reverse=True)
        latest_file = dump_files[0]

        if not save_dir:
            save_dir = tempfile.gettempdir()

        local_path = os.path.join(save_dir, latest_file["Name"])

        self._download_graph_file(latest_file["ServerRelativeUrl"], local_path)
        return local_path

    def download_file(self, server_relative_url: str, save_dir: str) -> str:
        """Downloads a specific file by its server relative URL."""
        filename = server_relative_url.split('/')[-1]
        local_path = os.path.join(save_dir, filename)
        self._download_graph_file(server_relative_url, local_path)
        return local_path

    def _download_graph_file(self, file_path, local_path, max_retries=5):
        """Download a file from SharePoint via Graph API with retry logic."""
        base_delay = 10
        url, _ = self._get_graph_url_for_path(file_path, "content")
        headers = {"Authorization": f"Bearer {self.token}"}

        for attempt in range(max_retries + 1):
            try:
                response = self.session.get(url, headers=headers, stream=True)

                if response.status_code in (503, 504, 429):
                    retry_after = response.headers.get('Retry-After')
                    wait_time = int(retry_after) if retry_after else base_delay * (2 ** attempt)
                    if attempt < max_retries:
                        print(f"SharePoint HTTP {response.status_code} for {file_path}. "
                              f"Retry {attempt + 1}/{max_retries} after {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception(
                            f"Failed to download file after {max_retries} retries: HTTP {response.status_code}"
                        )

                if response.status_code != 200:
                    raise Exception(
                        f"Failed to download file: HTTP {response.status_code} - {response.text}"
                    )

                os.makedirs(os.path.dirname(local_path) or '.', exist_ok=True)
                with open(local_path, 'wb') as local_file:
                    for chunk in response.iter_content(chunk_size=8192):
                        local_file.write(chunk)

                if attempt > 0:
                    print(f"File downloaded successfully to {local_path} (after {attempt} retries)")
                else:
                    print(f"File downloaded successfully to {local_path}")
                return local_path

            except Exception as e:
                error_str = str(e)
                is_transient = any(code in error_str for code in [
                    '503', '504', '429', 'Service Unavailable', 'Gateway Timeout'
                ])
                if (is_transient or 'Failed to download file: HTTP' not in error_str) and attempt < max_retries:
                    wait_time = base_delay * (2 ** attempt)
                    print(f"Error downloading {file_path}: {error_str}. "
                          f"Retry {attempt + 1}/{max_retries} after {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"Error downloading file {file_path}: {str(e)}")

    def upload_file(self, local_file_path: str, remote_filename: str = None) -> bool:
        """
        Upload a local file to the configured SharePoint target folder
        via Microsoft Graph API.

        Args:
            local_file_path: Absolute path to the local file.
            remote_filename: Optional override for the filename in SharePoint.
                             Defaults to the local file's basename.

        Returns:
            True on success, False on failure.
        """
        if not os.path.isfile(local_file_path):
            print(f"Upload error: Local file not found: {local_file_path}")
            return False

        filename = remote_filename or os.path.basename(local_file_path)

        try:
            drive_id, rel_path = self._resolve_drive_and_path(self.folder_path)

            # Build the upload URL:
            #   PUT /drives/{drive-id}/root:/{folder}/{filename}:/content
            encoded_parts = [
                urllib.parse.quote(s) for s in rel_path.split("/") if s
            ]
            if encoded_parts:
                target = "/".join(encoded_parts) + "/" + urllib.parse.quote(filename)
            else:
                target = urllib.parse.quote(filename)

            url = (
                f"https://graph.microsoft.com/v1.0/sites/{self.site_id}"
                f"/drives/{drive_id}/root:/{target}:/content"
            )

            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/octet-stream",
            }

            with open(local_file_path, "rb") as f:
                data = f.read()

            file_size_mb = len(data) / (1024 * 1024)
            print(f"Uploading {filename} to SharePoint ({file_size_mb:.2f} MB)...")

            # Retry logic for transient errors
            max_retries = 3
            base_delay = 5
            for attempt in range(max_retries + 1):
                response = self.session.put(url, headers=headers, data=data)

                if response.status_code in (200, 201):
                    print(f"SharePoint upload successful: {filename}")
                    return True

                if response.status_code in (429, 503, 504) and attempt < max_retries:
                    retry_after = response.headers.get("Retry-After")
                    wait = int(retry_after) if retry_after else base_delay * (2 ** attempt)
                    print(
                        f"SharePoint HTTP {response.status_code} on upload. "
                        f"Retry {attempt + 1}/{max_retries} after {wait}s..."
                    )
                    time.sleep(wait)
                    continue

                print(
                    f"SharePoint upload failed: HTTP {response.status_code} — "
                    f"{response.text[:500]}"
                )
                return False

        except Exception as e:
            print(f"SharePoint upload error: {str(e)}")
            return False

        return False
