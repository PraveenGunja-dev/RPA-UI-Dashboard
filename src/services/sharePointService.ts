import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
// @ts-ignore
import { ClientSecretCredential } from '@azure/identity';

// SharePoint configuration - these should be moved to environment variables
const PROXY_BASE_URL = ''; // Use relative path since frontend and backend are served from the same origin
const TENANT_ID = import.meta.env.VITE_SHAREPOINT_TENANT_ID || 'your-tenant-id';
const CLIENT_ID = import.meta.env.VITE_SHAREPOINT_CLIENT_ID || 'your-client-id';
const CLIENT_SECRET = import.meta.env.VITE_SHAREPOINT_CLIENT_SECRET || 'your-client-secret';
const SITE_NAME = import.meta.env.VITE_SHAREPOINT_SITE_NAME || 'your-site-name';

// Interfaces for SharePoint data
interface SharePointList {
  id: string;
  name: string;
  title: string;
  description: string;
}

interface SharePointListItem {
  id: string;
  fields: Record<string, any>;
}

interface SharePointFile {
  id: string;
  name: string;
  size: number;
  serverRelativeUrl: string;
  timeLastModified: string;
}

interface ExcelDataResponse {
  data: Record<string, any>[];
  columns: string[];
  count: number;
}

class SharePointService {
  constructor() {
    console.log('SharePoint service initialized with FastAPI endpoints:', PROXY_BASE_URL);
  }

  // Get lists from SharePoint site
  public async getLists(): Promise<SharePointList[]> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/lists`);
      
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) {
          throw new Error(`SharePoint Access Denied (403 Forbidden):
${errorText}

Please check:
1. Azure AD app permissions (Sites.Read.All or Sites.ReadWrite.All)
2. Admin consent has been granted
3. App has access to the SharePoint site
4. Credentials are correct`);
        }
        throw new Error(`Failed to fetch lists: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting lists:', error);
      throw error;
    }
  }

  // Get items from a specific list
  public async getListItems(listId: string): Promise<SharePointListItem[]> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/lists/${listId}/items`);
      
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) {
          throw new Error(`SharePoint Access Denied (403 Forbidden):
${errorText}

Please check:
1. Azure AD app permissions (Sites.Read.All or Sites.ReadWrite.All)
2. Admin consent has been granted
3. App has access to the SharePoint site
4. Credentials are correct`);
        }
        throw new Error(`Failed to fetch list items: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting list items:', error);
      throw error;
    }
  }

  // Create a new item in a specific list
  public async createListItem(listId: string, fields: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) {
          throw new Error(`SharePoint Access Denied (403 Forbidden):
${errorText}

Please check:
1. Azure AD app permissions (Sites.ReadWrite.All)
2. Admin consent has been granted
3. App has access to the SharePoint site
4. Credentials are correct`);
        }
        throw new Error(`Failed to create list item: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating list item:', error);
      throw error;
    }
  }

  // Get files from a specific folder
  public async getFiles(folderPath: string = '/'): Promise<SharePointFile[]> {
    try {
      const encodedPath = encodeURIComponent(folderPath);
      const url = `${PROXY_BASE_URL}/files?folder_path=${encodedPath}`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) {
          throw new Error(`SharePoint Access Denied (403 Forbidden):
${errorText}

Please check:
1. Azure AD app permissions (Sites.Read.All or Sites.ReadWrite.All)
2. Admin consent has been granted
3. App has access to the SharePoint site
4. Credentials are correct`);
        }
        throw new Error(`Failed to fetch files: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  }

  // Download a file by ID
  public async downloadFile(fileId: string): Promise<Blob> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/files/${fileId}/content`);
      
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) {
          throw new Error(`SharePoint Access Denied (403 Forbidden):
${errorText}

Please check:
1. Azure AD app permissions (Sites.Read.All or Sites.ReadWrite.All)
2. Admin consent has been granted
3. App has access to the SharePoint site
4. Credentials are correct`);
        }
        throw new Error(`Failed to download file: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Get Excel data directly from SharePoint file URL
  public async getExcelDataFromSharePoint(fileUrl: string, sheetName: string = 'Sheet1'): Promise<ExcelDataResponse> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}/excel-data-from-sharepoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_url: fileUrl,
          sheet_name: sheetName
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) {
          throw new Error(`SharePoint Access Denied (403 Forbidden):
${errorText}

Please check:
1. Azure AD app permissions (Sites.Read.All or Sites.ReadWrite.All)
2. Admin consent has been granted
3. App has access to the SharePoint site
4. Credentials are correct`);
        }
        throw new Error(`Failed to fetch Excel data from SharePoint: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting Excel data from SharePoint:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new SharePointService();