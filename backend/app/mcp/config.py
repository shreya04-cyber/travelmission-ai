import os

from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

# Absolute path to uploads directory
UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Stdio-based Filesystem MCP Toolset
filesystem_mcp = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command="npx",
            args=["-y", "@modelcontextprotocol/server-filesystem", UPLOAD_DIR],
        )
    ),
    tool_filter=["list_directory", "read_file"],
)
