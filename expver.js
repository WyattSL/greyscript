const vscode = require("vscode");
const debug = vscode.window.createOutputChannel("Greyscript Debugging")

var CompData = [
    "host_computer",
    "start_terminal",
    "build",
    "connect_service",
    "launch",
    "ping",
    "put",
    "scp",
    // Crypto,
    "aircrack",
    "airmon",
    "aireplay",
    "decipher",
    "smtp_user_list",
    // Metalib,
    "lib_name",
    "version",
    "overflow",
    // Metaxploit,
    "load",
    "net_use",
    "rshell_client",
    "rshell_server",
    "scan_address",
    "scan",
    "sniffer",
    // Port,
    "port_number",
    "is_closed",
    "get_lan_ip",
    // Router,
    "bssid_name",
    "device_ports",
    "devices_lan_ip",
    "essid_name",
    "firewall_rules",
    "kernel_version",
    "local_ip",
    "ping_port",
    "port_info",
    "public_ip",
    "used_ports",
    // NetSession,
    "dump_lib",
    // File,
    "chmod",
    "copy",
    "move",
    "rename",
    "path",
    "parent",
    "name",
    "get_content",
    "set_content",
    "is_binary",
    "has_permission",
    "delete",
    "get_folders",
    "get_files",
    "permissions",
    "owner",
    "set_owner",
    "group",
    "set_group",
    "size",
    // Computer,
    "get_ports",
    "File",
    "create_folder",
    "is_network_active",
    "touch",
    "show_procs",
    "network_devices",
    "change_password",
    "create_user",
    "delete_user",
    "create_group",
    "delete_group",
    "groups",
    "close_program",
    "wifi_networks",
    "connect_wifi",
    "connect_ethernet",
    "network_gateway",
    "active_net_card",
    // General,
    "typeof",
    "get_router",
    "get_switch",
    "nslookup",
    "print",
    "clear_screen",
    "active_user",
    "home_dir",
    "get_shell",
    "user_input",
    "include_lib",
    "exit",
    "user_mail_address",
    "user_bank_number",
    "whois",
    "wait",
    "command_info",
    "program_path",
    "current_path",
    "format_columns",
    "current_date",
    "is_lan_ip",
    "is_valid_ip",
    "bitwise",
    // Numeric
    "abs",
    "acos",
    "asin",
    "atan",
    "tan",
    "cos",
    "sin",
    "char",
    "floor",
    "range",
    "round",
    "rnd",
    "sign",
    "sqrt",
    "str",
    "ceil",
    "pi",
    // Strings
    "remove",
    "hasIndex",
    "indexOf",
    "lastIndexOf",
    "slice",
    "split",
    "replace",
    "trim",
    "indexes",
    "code",
    "len",
    "lower",
    "upper",
    "val",
    "values",
    "to_int",
    // Maps & Lists
    "push",
    "pop",
    "shuffle",
    "sum",
    // Lists
    "sort",
    "join",
    "reverse"
]

var TypeData = {
    // Shell
    "host_computer": "shell",
    "start_terminal": "shell",
    "build": "shell",
    "connect_service": "shell",
    "launch": "shell",
    "ping": "shell",
    "put": "shell",
    "scp": "shell",
    // Crypto
    "aircrack": "crypto",
    "airmon": "crypto",
    "aireplay": "crypto",
    "decipher": "crypto",
    "smtp_user_list": "crypto",
    // Metalib,
    "lib_name": "metalib",
    "version": "metalib",
    "overflow": "metalib",
    // Metaxploit,
    "load": "metaxploit",
    "net_use": "metaxploit",
    "rshell_client": "metaxploit",
    "rshell_server": "metaxploit",
    "scan_address": "metaxploit",
    "scan": "metaxploit",
    "sniffer": "metaxploit",
    // Port,
    "port_number": "port",
    "is_closed": "port",
    "get_lan_ip": "port",
    // Router,
    "bssid_name": "router",
    "device_ports": "router",
    "devices_lan_ip": "router",
    "essid_name": "router",
    "firewall_rules": "router",
    "kernel_version": "router",
    "local_ip": "router",
    "ping_port": "router",
    "port_info": "router",
    "public_ip": "router",
    "used_ports": "router",
    // NetSession,
    "dump_lib": "netsession",
    // File,
    "chmod": "file",
    "copy": "file",
    "move": "file",
    "rename": "file",
    "path": "file",
    "parent": "file",
    "name": "file",
    "get_content": "file",
    "set_content": "file",
    "is_binary": "file",
    "has_permission": "file",
    "delete": "file",
    "get_folders": "file",
    "get_files": "file",
    "permissions": "file",
    "owner": "file",
    "set_owner": "file",
    "group": "file",
    "set_group": "file",
    "size": "file",
    // Computer,
    "get_ports": "computer",
    "File": "computer",
    "create_folder": "computer",
    "is_network_active": "computer",
    "touch": "computer",
    "show_procs": "computer",
    "network_devices": "computer",
    "change_password": "computer",
    "create_user": "computer",
    "delete_user": "computer",
    "create_group": "computer",
    "delete_group": "computer",
    "groups": "computer",
    "close_program": "computer",
    "wifi_networks": "computer",
    "connect_wifi": "computer",
    "connect_ethernet": "computer",
    "network_gateway": "computer",
    "active_net_card": "computer",
    // General,
    "typeof": "notdot",
    "get_router": "notdot",
    "get_switch": "notdot",
    "nslookup": "notdot",
    "print": "notdot",
    "clear_screen": "notdot",
    "active_user": "notdot",
    "home_dir": "notdot",
    "get_shell": "notdot",
    "user_input": "notdot",
    "include_lib": "notdot",
    "exit": "notdot",
    "user_mail_address": "notdot",
    "user_bank_number": "notdot",
    "whois": "notdot",
    "wait": "notdot",
    "command_info": "notdot",
    "program_path": "notdot",
    "current_path": "notdot",
    "format_columns": "notdot",
    "current_date": "notdot",
    "is_lan_ip": "notdot",
    "is_valid_ip": "notdot",
    "bitwise": "notdot",
    // Numeric
    "abs": "notdot",
    "acos": "notdot",
    "asin": "notdot",
    "atan": "notdot",
    "tan": "notdot",
    "cos": "notdot",
    "sin": "notdot",
    "char": "notdot",
    "floor": "notdot",
    "range": "notdot",
    "round": "notdot",
    "rnd": "notdot",
    "sign": "notdot",
    "sqrt": "notdot",
    "str": "notdot",
    "ceil": "notdot",
    "pi": "notdot",
    // Strings
    "remove": "string",
    "hasIndex": "string",
    "indexOf": "string",
    "lastIndexOf": "string",
    "slice": "string",
    "split": "string",
    "replace": "string",
    "trim": "string",
    "indexes": "string",
    "code": "string",
    "len": "string",
    "lower": "string",
    "upper": "string",
    "val": "string",
    "values": "string",
    "to_int": "string",
    // Maps & Lists
    "push": "map",
    "pop": "map",
    "shuffle": "map",
    "sum": "map",
    // Lists
    "sort": "list",
    "join": "list",
    "reverse": "list"
}

var Types = [
    "shell",
    "computer",
    "file",
    "string",
    "number",
    "int",
    "float",
    "map",
    "list",
    "router",
    "port",
    "metalib",
    "metaxpoit",
    "netsession"
]

var ArgData = {
    "host_computer": 0,
    "start_terminal": 0,
    "build": 2,
    "connect_service": 4,
    "launch": 2,
    "ping": 1,
    "put": 3,
    "scp": 3,
    // Crypto,
    "aircrack": 1,
    "airmon": 1,
    "aireplay": 3,
    "decipher": 2,
    "smtp_user_list": 2,
    // Metalib,
    "lib_name": 0,
    "version": 0,
    "overflow": 3,
    // Metaxploit,
    "load": 1,
    "net_use": 2,
    "rshell_client": 3,
    "rshell_server": 0,
    "scan_address": 1,
    "scan": 1,
    "sniffer": 1,
    // Port,
    "port_number": 0,
    "is_closed": 0,
    "get_lan_ip": 0,
    // Router,
    "bssid_name": 0,
    "device_ports": 0,
    "devices_lan_ip": 0,
    "essid_name": 0,
    "firewall_rules": 0,
    "kernel_version": 0,
    "local_ip": 0,
    "ping_port": 1,
    "port_info": 1,
    "public_ip": 0,
    "used_ports": 0,
    // NetSession,
    "dump_lib": 0,
    // File,
    "chmod": 2,
    "copy": 2,
    "move": 2,
    "rename": 1,
    "path": 0,
    "parent": 0,
    "name": 0,
    "get_content": 0,
    "set_content": 1,
    "is_binary": 0,
    "has_permission": 1,
    "delete": 0,
    "get_folders": 0,
    "get_files": 0,
    "permissions": 0,
    "owner": 0,
    "set_owner": 1,
    "group": 0,
    "set_group": 1,
    "size": 0,
    // Computer,
    "get_ports": 0,
    "File": 1,
    "create_folder": 2,
    "is_network_active": 0,
    "touch": 2,
    "show_procs": 0,
    "network_devices": 0,
    "change_password": 2,
    "create_user": 2,
    "delete_user": 2,
    "create_group": 2,
    "delete_group": 2,
    "groups": 1,
    "close_program": 1,
    "wifi_networks": 0,
    "connect_wifi": 4,
    "connect_ethernet": 3,
    "network_gateway": 0,
    "active_net_card": 0,
    // General,
    "typeof": 1,
    "get_router": 1,
    "get_switch": 1,
    "nslookup": 1,
    "print": 1,
    "clear_screen": 0,
    "active_user": 0,
    "home_dir": 0,
    "get_shell": 2,
    "user_input": 2,
    "include_lib": 1,
    "exit": 1,
    "user_mail_address": 0,
    "user_bank_number": 0,
    "whois": 1,
    "wait": 1,
    "command_info": 1,
    "program_path": 0,
    "current_path": 0,
    "format_columns": 1,
    "current_date": 0,
    "is_lan_ip": 1,
    "is_valid_ip": 1,
    "bitwise": 3,
    // Numeric
    "abs": 1,
    "acos": 1,
    "asin": 1,
    "atan": 1,
    "tan": 1,
    "cos": 1,
    "sin": 1,
    "char": 1,
    "floor": 1,
    "range": 3,
    "round": 2,
    "rnd": 1,
    "sign": 1,
    "sqrt": 1,
    "str": 1,
    "ceil": 1,
    "pi": 0,
    // Strings
    "remove": 1,
    "hasIndex": 1,
    "indexOf": 2,
    "lastIndexOf": 1,
    "slice": 3,
    "split": 1,
    "replace": 2,
    "trim": 0,
    "indexes": 0,
    "code": 0,
    "len": 0,
    "lower": 0,
    "upper": 0,
    "val": 0,
    "values": 0,
    "to_int": 0,
    // Maps & Lists
    "push": 1,
    "pop": 1,
    "shuffle": 0,
    "sum": 0,
    // Lists
    "sort": 1,
    "join": 1,
    "reverse": 0
}

var Examples = {
    "get_shell": [
        ["Shell = get_shell"],
        ["RootShell = get_shell(\"root\",\"root_password\")"]
    ]
}

var CompTypes = { // Constant 20 Function 2 Property 9 Method 1 Variable 5 Interface 7
    "default": 2,
    "pi": 20,
    "name": 9,
    "params": 5,
    "path": 9,
    "dump_lib": 1,
    "version": 9,
    "lib_name": 9,
    "host_computer": 1,
    "start_terminal": 1,
    "get_lan_ip": 9,
    "is_closed": 9,
    "port_number": 9,
    "get_files": 9,
    "get_folders": 9,
    "size": 9,
    "is_folder": 9,
    "is_binary": 9,
    "group": 9,
    "owner": 9,
    "permissions": 9
}

var HoverData = {
    // Control
    "for": "for VAR in list/map\n\nA for loop can loop over any list, including ones easily created with the range function.",
    "while": "Use a while block to loop as long as a condition is true.",
    "break": "The break statement jumps out of a while or for loop",
    "continue": "The continue statement jumps to the top of the loop, skipping the rest of the current iteration.",
    "if": "Use if blocks to do different things depending on some condition. \nInclude zero or more else if blocks and one optional else block.",
    "else": "Use if blocks to do different things depending on some condition. \nInclude zero or more else if blocks and one optional else block.",
    // Shell
    "host_computer": "Shell.host_computer() : Computer\n\nReturns the computer associated with the Shell.",
    "start_terminal": "Shell.start_terminal() : Null\n\nLaunch an active terminal from the Shell.",
    "build": "Shell.build(string pathSource, string pathBinary) : Int or String\n\nCompile the source code of the file that is in the provided path, and save the executable in the destination path.\nThe name of the executable is the same as that of the source file without the extension.\nThe provided paths must be absolutes.",
    "connect_service": "Shell.connect_service(string ip, int port, string username, string password) : Shell\n\nConnect to a remote service. Returns a shell if the connection has been established correctly.",
    "launch": "Shell.launch(string path, string args) : Null\n\nLaunches the command in the provided path.",
    "ping": "Shell.ping(string ip) : Int\n\nReturns true if the remote address could be reached, false otherwise. Firewalls do not block ping requests.",
    "put": "Shell.put(string pathOrigin, string pathDestination, shell remoteShell) : Int or String\n\nCopy a file from one computer to the other through the network.",
    "scp": "Shell.scp(string pathOrigin, string pathDestination, shell remoteShell) : Int or String\n\nCopy a file from one computer to the other through the network.",
    // Crypto
    "aircrack": "Crypto.aircrack(string path) : String or Null\n\nReturns a string with the password generated from the file created by aireplay.",
    "airmon": "Crypto.airmon(string option, string interface) : Int\n\nEnables or disables the monitor mode of a network device. The option parameter can only be 'start' or 'stop'.",
    "aireplay": "Crypto.aireplay(string essid, string bssid, opt int maxAcks) : Int or String\n\nUsed to inject frames on wireless interfaces.\n\n\n\nOnce the command with Control+C is stopped, it will save the captured information in a text file called file.cap in the path where the terminal is currently located.\n\nAlternatively, a maximum of captured acks can be specified for the command to stop automatically, saving the file.cap file as described above.\n\nIn the event that there is an error, a string will be returned with the message indicating the problem.",
    "decipher": "Crypto.decipher(string user, string encryptedPass) : String or Null\n\nStart the process of decrypting the password.",
    "smtp_user_list": "Crypto.smtp_user_list(string ip, int port) : List[string]\n\nSMTP services are mail services. When using this method with the IP of a mail server, due to a vulnerability in the service, it returns a list of the existing users on the computer where the SMTP service is working. \nIf these users also have an email account registered on the SMTP server, it will be indicated in the list.",
    // Metalib
    "lib_name": "Metalib.lib_name() : String\n\nPrint the name of the library.",
    "version": "Metalib.version() : String\n\nPrint the version of the library.",
    "overflow": "Metalib.overflow(string address, string value, opt string arguments) : Shell or Computer or File or Int or Null\nExploits the indicated vulnerability through the buffer overflow method.\nThe object returned can be of various types or even not return anything, so it is advisable to use the typeof method with the object returned.\nDepending on the result, it may be necessary to pass extra arguments so that the exploit runs correctly, for example in the case of a password change.",
    // Metaxploit
    "load": "Metaxploit.load(string path) : Metalib or Null\n\nLoad the library in memory and return it as a metalib type if the process was successful.",
    "net_use": "Metaxploit.net_use(string ip, opt int port) : NetSession or Null\n\nIt connects to the specified address and establishes a null session to gain access to a library remotely.\nThis type of attack is only available for services that work remotely.\nIf no port is specified, it will connect directly to the router.\nIf the process has been executed correctly, an object of type net_session will be returned.",
    "rshell_client": "Metaxploit.rshell_client(string ip, int port, opt string proccessName) : String or Int\n\nLaunches a process on the victim's machine, which silently tries to continuously connect in the background to the specified address and port.\nFor the reverse shell to run successfully, the rshell service must be installed and the portforward configured correctly on the machine where the server is waiting for the victim's connection.",
    "rshell_server": "Metaxploit.rshell_server() : List[Shell] or String\n\nThis method returns a list of shell objects that have been reverse shell connected to this machine.\nIn order to manage the connections received, the rshell service must be installed on the machine that receives the victims' connections.",
    "scan_address": "Metaxploit.scan_address(metalib Metalib, string address) : String or Null\n\nIt analyzes a specific memory address and shows the vulnerable parts that can be exploited.",
    "scan": "Metaxploit.scan(metalib Metalib) : List or Null\n\nAnalyze the memory areas occupied by the library in search of vulnerabilities. Returns a list with the affected memory zones.",
    "sniffer": "Metaxploit.sniffer(opt bool saveEncodeSource) : String\n\nThe terminal listens to the network packets of any connection that passes through this device. \nWhen any connection information is captured, it prints a string with the obtained data. \nIt can save the source code of the encode script if saveEncSource is true.\nNull is returned if the listen could not be started.",
    // Port
    "port_number": "Port.port_number : Int\n\nReturns an int with the configured port number.",
    "is_closed": "Port.is_closed : Int\n\nReturns true if this port is closed, false otherwise.",
    "get_lan_ip": "Port.get_lan_ip : String\n\nReturns a string with the local IP address of the computer pointed to by this port.",
    // Router
    "bssid_name": "Router.bssid_name : String\n\nReturns a string with the BSSID value of the router.",
    "device_ports": "Router.device_ports(String ip) : List[port]\n\nTakes a LAN IP address and returns a list with open ports accessible in the network.",
    "devices_lan_ip": "Router.devices_lan_ip : List[string]\n\nReturns a list with any computer whose gateway is the current device with the ips of the routers and switches that it can reach with a ping. \nSome of the returned addresses could be behind a firewall",
    "essid_name": "Router.essid_name : String\n\nReturns a string with the ESSID value of the router.",
    "firewall_rules": "Router.firewall_rules : List[string]\n\nReturns a string list with the firewall rules present in the router or switch.",
    "kernel_version": "Router.kernel_version : String\n\nReturns a string with the version of the kernel_router.so library",
    "local_ip": "Router.local_ip : String\n\nReturns a string with the computer or router local ip address.",
    "ping_port": "Router.ping_port(int port) : Port\n\nReturns the port object that is behind the port number provided if exists, null otherwise.",
    "port_info": "Router.port_info(port Port) : String\n\nReturns a string with the information of the port that has been provided. The port provided must not belong to another network than this router.",
    "public_ip": "Router.public_ip : String\n\nReturns the public ip of the router or computer object.",
    "used_ports": "Router.used_ports : List\n\nReturns an array of ports that are being used in this router.",
    // NetSession
    "dump_lib": "NetSession.dump_lib : Metalib\n\nReturns the metalib associated with the remote service.\n\n\n\nFor example, connecting to a computer with the ssh service will return a metalib libssh object.\n\nIn the case of connecting to a router, it returns a metalib kernel_router object.",
    // File
    "chmod": "File.chmod(string path, opt int isRecursive) : Int\n\nModifies the file's permissions\n\n\n\nTakes a permissions string (e.g. u+wr) and optional recursive flag (int 0 or 1)\n\nIf the file is a folder and the recursive flag is 1, the permissions change will apply recursively, to all the files and folders inside the folder.",
    "copy": "File.copy(string path, string newName) : Int\n\nCopy the file to the specified path.",
    "move": "File.move(string path, string newName) : Int\n\nMove the file to the specified path.",
    "rename": "File.move(string newName) : Int\n\nRename the file with the name provided.",
    "path": "File.path : String\n\nReturns a string with the path of the file.",
    "parent": "File.parent : File\n\nReturns the folder that contains this file.",
    "name": "File.name : String\n\nReturns a string with the name of the file.",
    "get_content": "File.get_content : String\n\nReturns a string with the contents of the text file.",
    "set_content": "File.set_content(string contents) : Null\n\nSave the text in the file. The content will be overwritten if there is already text saved in the file.",
    "is_folder": "File.is_folder : Int\n\nReturns true if the file is folder, false otherwise.",
    "is_binary": "File.is_binary : Int\n\nReturns true if the file is binary, false otherwise.",
    "has_permission": "File.has_permission(string permission) : Int\n\nReturns true if the user who launches the script has the necessary permissions.\nThe type_perm parameter is used for reading ('r'), writing ('w') and execution ('x')",
    "delete": "File.delete : Int\n\nDelete the file",
    "get_folders": "File.get_folders : List[file]\n\nReturns an array of the folders contained in this object. This function is only available if this object is a folder, so it is advisable to first use the is_folder function before calling this method.",
    "get_files": "File.get_files : List[file]\n\nReturns an array of files (excluded folders) contained in this object. This function is only available if this object is a folder, so it is advisable to first use the is_folder function before calling this method.",
    "permissions": "File.permissions : String\n\nReturns a string with the current file permissions.",
    "owner": "File.owner : String\n\nReturns a string with the name of the file owner.",
    "set_owner": "File.set_owner(string username, opt int isRecursive) : Int\n\nApply a owner to this file. By default, the owner does not apply recursively. To apply the owner recursively, the optional parameter must be 1.",
    "group": "File.group : String\n\nReturns a string with the name of the group to which this file belongs.",
    "set_group": "File.set_group(string groupname, opt int isRecursive) : Int\n\nApply a group to this file. By default, the group does not apply recursively. To apply the group recursively, the optional parameter must be 1.",
    "size": "File.size : Int\n\nReturns a string with the size of the file in bytes.",
    // Computer
    "get_ports": "Computer.get_ports : List[port]\n\nReturns an array of active ports on the computer.",
    "File": "Computer.File(string path) : File or Null\n\nReturns the file located in the given path, relative or absolute. The file returned can be a folder. If the file does not exist, it is returned null.",
    "create_folder": "Computer.create_folder(string path, string name) : Int\n\nCreate a folder in the specified path.",
    "is_network_active": "Computer.is_network_active : Int\n\nReturns true if the computer has internet access, false otherwise.",
    "touch": "Computer.touch(string path, string name) : Int\n\nCreate an empty text file. Returns true if the file has been created, false otherwise.",
    "show_procs": "Computer.show_procs : String\n\nReturns a string with the list of active processes on the machine.",
    "network_devices": "Computer.network_devices : String\n\nReturns a string with the list of network devices available on the computer.",
    "change_password": "Computer.change_password(string username, string password) : Int\n\nChange the password of an existing user on the machine, for a new one.\nIt is necessary to be root to be able to execute the method. Returns true on success, false otherwise.",
    "create_user": "Computer.create_user(string username, string password) : Int\n\nCreate a user on the machine, with the specified name and password. It is necessary to be root to be able to execute the method. Returns true on success, false otherwise.",
    "delete_user": "Computer.delete_user(string username, opt bool deleteHome) : Int\n\nIt deletes the indicated user from the computer, also deleting its home folder optionally. \nBy default, if the optional parameter is not passed, the home folder will not be deleted.\nIt is necessary to be root to be able to execute the method. Returns true on success, false otherwise.",
    "create_group": "Computer.create_group(string username, string group) : Int\n\nCreate a new group associated with an existing user on the machine. It is necessary to be root to be able to execute the method.",
    "delete_group": "Computer.delete_group(string username, string group) : Int\n\nDelete the indicated user group. It is necessary to be root in order to execute this method.",
    "groups": "Computer.groups(string username) : String\n\nReturns a string with the list of groups created in the indicated user.",
    "close_program": "Computer.close_program(int PID) : Int\n\nClose the program associated with the PID. To show the list of the running programs along with their PIDs use the ps command.",
    "wifi_networks": "Computer.wifi_networks(string netDevice) : List[string]\n\nReturns a list of the Wi-Fi networks that are available.",
    "connect_wifi": "Computer.connect_wifi(string netDevice, string bssid, string essid, string password) : Int\n\nConnect to the indicated Wifi network. Returns true if the connection was successful.",
    "connect_ethernet": "Notice: Ethernet is currently disabled in multiplayer on both public and nightly builds!\n\nComputer.connect_ethernet(string netDevice, string localIp, string gateway)\nSet up a new IP address on the machine through the ethernet connection.\nReturns a string with the error message if the connection failed. In case of success, an empty string is returned.",
    "network_gateway": "Computer.network_gateway : String\n\nReturns a string with the gateway configured on the computer.",
    "active_net_card": "Computer.active_net_card : String\n\nReturns a string with the keyword WIFI if the current device is connected to a router by WiFi, if it is connected by cable a string with the keyword ETHERNET is returned.",
    // General
    "typeof": "typeof(any object) : String\n\nReturns a string with the type of the object passed as a parameter.",
    "get_router": "get_router(opt string ip) : Router\n\nReturns the router whose public IP matches, otherwise returns null.\nIf the ip_address parameter is not specified, returns the router to which the computer executing this command is connected.",
    "get_switch": "get_switch(string ip) : Router?\n\nReturns the switch on the local network whose IP matches, otherwise it returns null.",
    "nslookup": "nslookup(string website) : String\n\nReturns the IP address that is behind the web address that has been provided.",
    "print": "print(string text) : Null\n\nPrint on the Terminal the message.",
    "clear_screen": "clear_screen : Null\n\nDelete any text from the terminal.",
    "active_user": "active_user : String\n\nReturns a string with the name of the user who is executing the script.",
    "home_dir": "home_dir : String\n\nReturns a string with home folder path of the user who is executing the script.",
    "get_shell": "get_shell(opt string username, opt string password) : Shell\n\nReturns the shell that is executing the script if it is called without parameters. \nPassing a username and password, it returns a shell with those credentials if are correct.",
    "user_input": "user_input(opt string prompt, opt int isPassword) : String\n\nIt puts the program on hold to receive the user input, which will be processed as a string. If the password mode is activated, the input text will be hidden with asterisks.",
    "include_lib": "include_lib(string path) : any\n\nIncludes an external library to be used in scripting. If the library has been included correctly, it will return an object of corresponding type with the library, null otherwise",
    "exit": "exit(opt string message) : Null\n\nStops the execution of the script at the time this method is executed. Optionally you can pass a string as a message that will be printed in the terminal when the program ends.",
    "user_mail_address": "Returns a string with the user's email address that is executing this script.\nThis is only defined on a player's home computer.",
    "user_bank_number": "Returns a string with the bank account number of the user who is executing this script.\nThis is only defined on a player's home computer.",
    "whois": "whois(string ip) : String\n\nShows the administrator information behind the IP provided.",
    "wait": "wait(float seconds) : Null\n\nPauses the script for the indicated time. If duration is not specified, the default value is 1 second.",
    "command_info": "command_info(string command) : String\n\nReturns the information of common commands of the Operating System, such as mkdir, whois, etc.",
    "program_path": "program_path : String\n\nReturns a string with the path of the program that is running at this time.",
    "current_path": "current_path : String\n\nIt returns a string with the path in which the terminal is at the moment of launching the script.",
    "format_columns": "format_columns(string text) : String\n\nFormat the text provided so that it is ordered by columns.",
    "current_date": "current_date : String\n\nReturns the time and date.",
    "is_lan_ip": "is_lan_ip(string ip) : Int\n\nReturns true if the provided address is local, false otherwise. If the provided IP is not valid, it also returns false.",
    "is_valid_ip": "is_valid_ip(string ip) : Int\n\nReturns true if the provided address is valid, false otherwise.",
    "bitwise": "bitwise(string operator, int num1, int num2) : Int\n\nBitwise operators are used for manipulating data at the bit level.\nBitwise operates on one or more bit patterns or binary numerals at the level of their individual bits. \nThey are used in numerical computations to make the calculation process faster.\nThe operator argument accepts the following operators:\n&, |, ^, <<, >>, >>>",
    // Numeric
    "abs": "abs(float) : Float\n\nReturns the absolute value of the provided input.",
    "acos": "acos(float) : Float\n\nReturns the arccosine of the provided input in radians.",
    "asin": "asin(float) : Float\n\nReturns the arcsine of the provided input in radians.",
    "atan": "atan(float) : Float\n\nReturns the arctangent of the provided input in radians.",
    "tan": "tan(rad) : Float\n\nReturns the tangent of the provided input.",
    "cos": "cos(rad) : Float\n\nReturns the cosine of the provided input.",
    "sin": "sin(rad) : Float\n\nReturns the sine of the provided input.",
    "char": "char(int) : String\n\nReturns the unicode character at the provided input's code point.",
    "floor": "floor(float) : Int\n\nReturns the provided input floored to it's base integer.",
    "range": "range(start, opt end, opt increment) : List[float]\n\nReturns a list object containing values from the start to the end, incrementing by increment.",
    "round": "round(float, opt decimal) : Float\n\nReturns the provided input rounded to the decimal place provided.",
    "rnd": "rnd(opt seed) : Float\n\nReturns a random float between 0 and 1. If seed is provide, it seeds the random number with the given value.",
    "sign": "sign(float) : Int\n\nReturns the sign of the provided input.",
    "sqrt": "sqrt(float) : Float\n\nReturns the square root of the provided input.",
    "str": "str(float) : String\n\nConverts the provided input into a string.",
    "ceil": "ceil(float) : Int\n\nReturns the provided input raised to the next or equal integer.",
    "pi": "pi : float\n\nReturns 3.14159265358979 (this will probably never be useful!)",
    // Strings
    "remove": [
        "String.remove(string) : String\n\nReturns the string without the first occurrence of the provided input.",
        "Map.remove(key) : Map\n\nReturns the map without the first occurrence of the provided input.",
        "List.remove(value) : List\n\nReturns the list without the first occurrence of the provided input."
    ],
    "hasIndex": [
        "String.hasIndex(index) : Int\n\nReturns 1 if the index exists. Returns 0 otherise.",
        "List.hasIndex(index) : Int\n\nReturns 1 if the index exists. Returns 0 otherise.",
        "Map.hasIndex(index) : Int\n\nReturns 1 if the index exists. Returns 0 otherise."
    ],
    "indexOf": [
        "String.indexOf(string, opt begin) : Int\n\nReturns the first index of the provided input with the string. Optionally searches after begin.",
        "List.indexOf(value, opt begin) : Int\n\nReturns the index of the provided value. Optionally searches after begin.",
        "Map.indexOf(value, opt begin) : Int\n\nReturns the first index of the provided input with the string. Optionally searches after begin."
    ],
    "lastIndexOf": "String.lastIndexOf(string) : Int\n\nReturns the last index of the provided input with the string. Optionally searches after begin.",
    "slice": [
        "slice(String, opt start, opt end) : String\n\nReturns the provided string from index start to index end.",
        "slice(List, opt start, opt end) : String\n\nReturns the provided list from index start to index end.",
    ],
    "split": "String.split(seperator) : List[string]\n\nReturns a list object of substrings.",
    "replace": "String.replace(old,new) : String\n\nReturns the string with any instances of new replaced with old.",
    "trim": "String.trim : String\n\nReturns the string stripped of any spacing at the beginning or end.",
    "indexes": [
        "String.indexes : List[string]\n\nReturns a list object containing indexes of all characters in the string.",
        "List.indexes : List[string]\n\nReturns a list object containing the list's indexes",
        "Map.indexes : List[string]\n\nReturns a list object containing the map's indexes.",
    ],
    "code": "String.code : Int\n\nReturns the unicode code point of the first character in the string.",
    "len": [
        "String.len : Int\n\nReturns the length of the provided object.",
        "List.len : Int\n\nReturns the length of the provided object.",
        "Map.len : Int\n\nReturns the length of the provided object.",
    ],
    "lower": "String.lower : String\n\nReturns the lowercase string.",
    "upper": "String.upper : String\n\nReturns the uppercase string.",
    "val": "String.val : Float\n\nConverts the string to a float.",
    "values": [
        "String.values : List[string]\n\nReturns a list object containing values of all characters in the string.",
        "List.values : List[string]\n\nReturns a list object containing the list's values",
        "Map.values : List[string]\n\nReturns a list object containing the map's values.",
    ],
    "to_int": "String.to_int : Int\n\nConverts the string to a integer.",
    // Maps & Lists
    "push": [
        "List.push(any) : List\n\nPushes the provided input onto the end of the list. Returns the updated list, and updates the list in it's place.",
        "Map.push(any) : Map\n\nPushes the provided input onto the end of the map. Returns the updated map, and updates the map in it's place.",
    ],
    "pop": [
        "List.pop : Any\n\nReturns the key of the first element in the map or list, and removes that element from the map or list.",
        "Map.pop : Any\n\nReturns the key of the first element in the map or list, and removes that element from the map or list.",
    ],
    "shuffle": [
        "Map.shuffle : Null\n\nRandomly remaps values in a map or list, leaving the keys in their original order.",
        "List.shuffle : Null\n\nRandomly remaps values in a map or list, leaving the keys in their original order.",
    ],
    "sum": [
        "List.sum : int\n\nReturns the total of all numeric values in a list.",
        "Map.sum : int\n\nReturns the total of all numeric values in a map.",
    ],
    // Lists
    "sort": "List.sort : List\n\nSorts a list alphanumerically.",
    "join": "List.join(seperator) : String\n\nConcatenates all items within the list and returns them in a single string.",
    "reverse": "List.reverse : Null\n\nReverses the list, rearranging the element in reverse order."
}

function activate(context) {
    let hoverD = vscode.languages.registerHoverProvider('greyscript', {
        provideHover(document,position,token) {
            if (!vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) return;
            let range = document.getWordRangeAtPosition(position)
            let word = document.getText(range)
            debug.appendLine(word)
            if (HoverData[word]) {
                return new vscode.Hover({
                    language: "greyscript",
                    value: HoverData[word]
                });
            }
        }
    })

    if (vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) context.subscriptions.push(hoverD)

    let compD = vscode.languages.registerCompletionItemProvider('greyscript', {
        provideCompletionItems(document,position,token,ccontext) {
            if (!vscode.workspace.getConfiguration("greyscript").get("autocomplete")) return;
            let range = document.getWordRangeAtPosition(position);
            var spos = range.start;
            if (spos.character-2 >= 0) var ppos = spos.with(spos.line, spos.character-2);
            if (spos.character-1 >= 0) var dpos = spos.with(spos.line, spos.character-1);
            var isDot = false;
            if (dpos && document.getText(new vscode.Range(dpos,dpos)) == ".") isDot = true;
            if (ppos) var prange = document.getWordRangeAtPosition(ppos);
            if (ppos) var pword = document.getText(prange)
            if (!ppos) var pword = ""
            let word = document.getText(range);
            debug.appendLine("request to complete: " + word);
            let output = []
            let match = function(c) {
                let w = word;
                if (TypeData[c]) {
                    if (TypeData[c] == "notdot" && !isDot) {
                        debug.appendLine(c+" nd 1");
                        return false;
                    }
                    if (TypeData[c] != "notdot" && isDot) {
                        debug.appendLine(c+" nd 2"); 
                        return false;
                    }
                }
                if (Types[pword.toLowerCase()] && pword.toLowerCase() != TypeData[c]) {
                    debug.appendLine(c+" ret 3");   
                    return false;
                }
                debug.appendLine("match function! W: " + w + " C: " + c + " matches: " + c.includes(w))
                return c.includes(w)
            }
            output = CompData.filter(match)
            var outputS = [];
            var i;
            for (i=0;i<output.length;i++) {
                outputS.push(i+""+output.shift)
            }
            debug.appendLine("Matches: " + output)
            let c;
            let out = [];
            var a = -1;
            for (c of output) {
                a++
                let type = CompTypes[c] || CompTypes["default"];
                let s = outputS[a]
                let t = new vscode.CompletionItem(c,type)
                t.sortText = s;
                let Ex = Examples[c];
                let Exs = [];
                if (Ex) {
                    let i;
                    for (i=0;i<Ex.length;i++) {
                        Exs[i] = Ex[i].join("\n");
                    }
                }
                var docs = HoverData[c]
                debug.appendLine("Docs: "+docs)
                if (Array.isArray(docs)) {
                    debug.appendLine("array trigger")
                    docs = docs.join("\n\n\n")
                    debug.appendLine("array out: "+docs)
                }
                t.documentation = docs
                if (Ex) t.documentation = docs+"\n\n"+Exs.join("\n\n")
                out.push(t);
            }
            return new vscode.CompletionList(out,true);
        }
    });

    if (vscode.workspace.getConfiguration("greyscript").get("autocomplete")) context.subscriptions.push(compD)

    let gecmd = vscode.commands.registerTextEditorCommand("greyScript.gotoError", (editor, edit, context) => {
        let options = {"prompt": "Enter provided line number"}
        vscode.window.showInputBox(options).then((line) => {
            line = Number(line)
            var text = editor.document.getText();
            var exp = new RegExp("else","gm")
            debug.appendLine(exp)
            var list = text.matchAll(exp)
            var exp2 = new RegExp("else if","gm") // TODO:  make it move cursor using pre built commands
            var list2 = text.matchAll(exp2)
            var l = 0
            var l2 = 0
            for (i of list) {
                var index = i.index+i[0].length;
                var r = new vscode.Range(1,0,1,index)
                var text = editor.document.getText(r)
                var lines = text.split("\n").length;
                if (lines <= line) l=l+1
            }
            for (i of list2) {
                var index = i.index+i[0].length;
                var r = new vscode.Range(1,0,1,index)
                var text = editor.document.getText(r)
                var lines = text.split("\n").length;
                if (lines <= line) l2=l2+1
            }
            var actualline = (line-l)+l2 // here
            debug.appendLine("actual error line: "+actualline)
            var linel = editor.document.lineAt(actualline-1).text.length;
            var pos1 = new vscode.Position(actualline-1, 0)
            var pos2 = new vscode.Position(actualline-1, linel)
            var range = new vscode.Range(pos1,pos2)
            //editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
            let options = {
                "selection": range
            };
            vscode.window.showTextDocument(editor.document, options)
        });
    });

    context.subscriptions.push(gecmd)
}

function deactivate() {}

module.exports = {activate, deactivate};