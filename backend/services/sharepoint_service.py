from office365.sharepoint.client_context import ClientContext
from office365.runtime.auth.client_credential import ClientCredential
from office365.sharepoint.files.file import File
import os
import tempfile
import re
from datetime import datetime
import ssl
import requests
import urllib3
# =============================================================================
# DISABLE SSL VERIFICATION (Not Secure, Only for Testing)
# =============================================================================
# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Patch requests to use verify=False
_original_request = requests.Session.request
def _patched_request(self, *args, **kwargs):
    kwargs['verify'] = False
    return _original_request(self, *args, **kwargs)
requests.Session.request = _patched_request

# Also disable SSL context verification
ssl._create_default_https_context = ssl._create_unverified_context
# =============================================================================

# Configuration (In production, load these from environment variables)
# User provided credentials
CLIENT_ID = "eb477319-b6fa-4619-832f-dcb69d0ecda2"
CLIENT_SECRET = "WGpGOFF+eUM3SEZyVFc3dE1CSldJa1VmY1FUZ3l4NHV3N240cGJEeg=="
TENANT_ID = "04c72f56-1848-46a2-8167-8e5d36510cbc"
SITE_URL = "https://adaniltd.sharepoint.com/sites/AGEL-Automation"
# Relative path to the folder. 
# Full URL from user: https://adaniltd.sharepoint.com/sites/AGEL-Automation/Shared%20Documents/Forms/AllItems.aspx...&id=%2Fsites%2FAGEL%2DAutomation%2FShared%20Documents%2FBots%2FAgent%20Dashboard
FOLDER_RELATIVE_URL = "/sites/AGEL-Automation/Shared Documents/Bots/Agent Dashboard"

class SharePointService:
    def __init__(self):
        self.ctx = self._authenticate()

    def _authenticate(self):
        """Authenticate with SharePoint using Client Credentials."""
        try:
            ctx = ClientContext(SITE_URL).with_credentials(
                ClientCredential(CLIENT_ID, CLIENT_SECRET)
            )
            return ctx
        except Exception as e:
            raise Exception(f"Failed to authenticate with SharePoint: {str(e)}")

    def list_files(self):
        """List files in the target folder."""
        try:
            folder = self.ctx.web.get_folder_by_server_relative_url(FOLDER_RELATIVE_URL)
            files = folder.files
            self.ctx.load(files)
            self.ctx.execute_query()
            
            file_list = []
            for file in files:
                file_list.append({
                    "Name": file.name,
                    "ServerRelativeUrl": file.serverRelativeUrl,
                    "TimeLastModified": file.time_last_modified
                })
            return file_list
        except Exception as e:
            raise Exception(f"Error listing files: {str(e)}")

    def download_latest_dump(self, save_dir: str = None) -> str:
        """
        Finds the latest Control Room Dump file and downloads it.
        Returns the path to the downloaded file.
        """
        files = self.list_files()
        
        # Filter for "dump" files or "bot status report"
        dump_files = [
            f for f in files 
            if ("dump" in f["Name"].lower() or "control room" in f["Name"].lower() or "bot status report" in f["Name"].lower()) 
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
        
        try:
            with open(local_path, "wb") as local_file:
                file = self.ctx.web.get_file_by_server_relative_url(latest_file["ServerRelativeUrl"])
                file.download(local_file)
                self.ctx.execute_query()
            return local_path
        except Exception as e:
            raise Exception(f"Error downloading file {latest_file['Name']}: {str(e)}")

    def download_file(self, server_relative_url: str, save_dir: str) -> str:
        """Downloads a specific file by its server relative URL."""
        filename = server_relative_url.split('/')[-1]
        local_path = os.path.join(save_dir, filename)
        try:
            with open(local_path, "wb") as local_file:
                file = self.ctx.web.get_file_by_server_relative_url(server_relative_url)
                file.download(local_file)
                self.ctx.execute_query()
            return local_path
        except Exception as e:
            raise Exception(f"Error downloading file {filename}: {str(e)}")
