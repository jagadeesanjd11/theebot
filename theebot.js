//hello
const child_process = require("child_process");
const http = require("http");
const fs = require("fs");
const url = require("url");
const os = require("os");
class TheeBot {
  tasks = [
    {
      perm: "--createtcp",
      run: "createTCP",
      example: "--createtcp <portno>",
      description: "Create TheeBot TCP server",
    },
    {
      perm: "--terminalexec",
      run: "terminalExec",
      example: "--terminalexec <command>",
      description: "Execute terminal in server",
    },
    {
      perm: "--killport",
      run: "killPort",
      example: "--killport <portno>",
      description: "Kill port number in server",
    },
    {
      perm: "--createisolatetcp",
      run: "createIsolateTCP",
      example: "--createisolatetcp <portno>",
      description: "Create isolate TheeBot TCP server",
    },
    {
      perm: "--help",
      run: "help",
      example: "--help",
      description: "TheeBot helps",
    },
    {
      perm: "--deletefile",
      run: "deleteFile",
      example: "--deletefile <filepath>",
      description: "Delete File in server",
    },
    {
      perm: "--readfile",
      run: "readFile",
      example: "--readfile <filepath>",
      description: "Read File in server",
    },
  ];
  authPassword = "theebot@JD11";
  constructor() {
    //console.log(this.tasks);
    this.watcher();
  }
  help(value = "") {
    let string = "";
    for (let i = 0; i < this.tasks.length; i++) {
      string +=
        "\n" + this.tasks[i].example + " -> " + this.tasks[i].description;
    }
    string +=
      "\n  http://<serveripaddress>:<portno> -> Execute theeBot commands";
    string +=
      "\n  http://<serveripaddress>:<portno>/file -> Create file in server";
    console.log(string);
    return string;
  }
  async taskRunner(perm, value) {
    let result;
    try {
      for (let i = 0; i < this.tasks.length; i++) {
        if (perm == this.tasks[i].perm) {
          result = await this[this.tasks[i].run](value);
          break;
        }
      }
    } catch (error) {
      result = error.message;
    }
    return result;
  }
  getPrems() {
    let tasks = [];
    for (let i = 0; i < process.argv.length; i++) {
      for (let j = 0; j < this.tasks.length; j++) {
        if (process.argv[i] == this.tasks[j].perm) {
          tasks.push({
            perm: process.argv[i],
            run: this.tasks[j].run,
            value: process.argv[i + 1],
          });
          break;
        }
      }
    }
    return tasks;
  }
  async watcher() {
    //console.log("hello", process.argv);
    let works = this.getPrems();
    for (let i = 0; i < works.length; i++) {
      let taskResult = await this.taskRunner(works[i].perm, works[i].value);
      //console.log(taskResult);
    }
  }
  async terminalExec(cmd) {
    let systemOutPromise = new Promise(function (myResolve, myReject) {
      let result = {};
      console.log("cmd", cmd);
      var workerProcess = child_process.exec(
        cmd,
        function (error, stdout, stderr) {
          result.error = error;
          if (error) {
            console.log(error.stack);
            console.log("Error code: " + error.code);
            console.log("Signal received: " + error.signal);
            //myReject(error);
          }
          //console.log("stdout: " + stdout);
          //console.log("stderr: " + stderr);
          result.stdout = stdout;
          result.stderr = stderr;
          myResolve(result);
        }
      );
      workerProcess.on("exit", function (code) {
        console.log("Child process exited with exit code " + code);
      });
    });
    return systemOutPromise;
  }
  async requestHandle(request) {
    let requestPromise = new Promise(function (resolve, reject) {
      var body = "";
      request.on("data", function (data) {
        body += data;
      });
      request.on("end", function () {
        resolve(body);
      });
    });
    return requestPromise;
  }
  async createTCP(port = 8081) {
    let html = "";
    port = port ? port : 8081;
    // Create a server
    http
      .createServer(
        async function (request, response) {
          let urldata = url.parse(request.url, true);
          let pathname = urldata.pathname;

          if (pathname == "/task") {
            console.log("Request for task received.", urldata.query);
            response.writeHead(200, { "Content-Type": "text/plain" });
            if (urldata.query && urldata.query.perm) {
              try {
                if (urldata.query.pass == this.authPassword) {
                  let taskres = await this.taskRunner(
                    urldata.query.perm,
                    urldata.query.value
                  );

                  if (typeof taskres == "string") {
                    html = taskres;
                  } else if (typeof taskres == "object") {
                    if (taskres.stdout) {
                      html = taskres.stdout;
                    } else {
                      html = JSON.stringify(taskres);
                    }
                  } else {
                    html = JSON.stringify(taskres);
                  }
                  response.write(html);
                } else {
                  response.write("Password is Incorrect");
                }
              } catch (error) {
                response.write(error.message);
              }
            }
          } else if (pathname == "/file") {
            html = `<!DOCTYPE html>
            <html>
            <body>
            <h2>Create file</h2>
            <pre id="result"></pre>
            <form id="sendForm" onsubmit="return send(event)">
              <label for="filename">File Name:</label><br>
              <input type="text" id="filename" name="filename" value="" required><br>
              <label for="content">Content:</label><br>
              <textarea id="content" name="content" cols="90" rows="20" required></textarea><br>
              <label for="pass">Password:</label><br>
              <input type="password" id="pass" name="pass" value="" required><br><br>
              <input type="submit" value="Submit">
            </form> 
            <script>
            function send(event){
                var request= new XMLHttpRequest(); 
                request.open('post', '/cratefile', true); 
                request.setRequestHeader("Content-Type", "application/json");
                request.onreadystatechange = function() { 
                    if (this.readyState == 4) { 
                    var data = this.responseText; 
                        console.log(data);
                        var result = document.querySelector("#result");
                        result.innerText = this.responseText;
                    }
                };
                var sendForm = new FormData(document.querySelector("#sendForm"));
                var sendData = {};
                sendForm.forEach(function(value,key){
                   console.log(value,key); 
                   sendData[key]=value;
                });
                request.send(JSON.stringify(sendData));
                return false;
            }
            </script>
            </body>
            </html>`;
            response.writeHead(200, { "Content-Type": "text/html" });
            response.write(html);
          } else if (pathname == "/cratefile") {
            response.writeHead(200, { "Content-Type": "text/plain" });
            try {
              if (request.method == "POST") {
                try {
                  let body = await this.requestHandle(request);
                  let post = JSON.parse(body);
                  if (post.pass == this.authPassword) {
                    let data = post.content;
                    fs.writeFileSync(post.filename, data);
                    let savefile = fs.readFileSync(post.filename, "utf8");
                    response.write(
                      `File saved\n----------------------\n` + savefile
                    );
                  } else {
                    response.write("Password is Incorrect");
                  }
                } catch (error) {
                  response.write(error.message);
                }
              } else {
                response.write("Invaild " + request.method + "method");
              }
            } catch (error) {
              console.log("error", error);
              response.write(error.message);
            }
          } else {
            html = `<!DOCTYPE html>
            <html>
            <body>
            <h2>Task form</h2>
            <pre id="result"></pre>
            <form id="sendForm" onsubmit="return send(event)">
              <label for="perm">Parameters:</label><br>
              <input type="text" id="perm" name="perm" value="" required><br>
              <label for="value">Value:</label><br>
              <input type="text" id="value" name="value" value="" ><br>
              <label for="pass">Password:</label><br>
              <input type="password" id="pass" name="pass" value="" required><br><br>
              <input type="submit" value="Submit">
            </form> 
            <script>
            function send(event){
                var sendForm = new URLSearchParams(new FormData(document.querySelector("#sendForm")));
                var request= new XMLHttpRequest(); 
                request.open('get', '/task?' + sendForm, true); 
                request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                request.onreadystatechange = function() { 
                    if (this.readyState == 4) { 
                    var data = this.responseText; 
                        console.log(data);
                        var result = document.querySelector("#result");
                        result.innerText = this.responseText;
                    }
                };
                request.send();
                return false;
            }
            </script>
            </body>
            </html>`;
            response.writeHead(200, { "Content-Type": "text/html" });
            response.write(html);
          }
          response.end();
        }.bind(this)
      )
      .listen(port);
    // Console will print the message
    const nets = os.networkInterfaces();
    let serverData = `Server running at http://serveripaddress:${port}/\n`;
    serverData += JSON.stringify(nets);
    console.log(serverData);
    return serverData;
  }
  pm2Stop() {}
  pm2Start() {}
  async killPort(port = 8081) {
    let result = "";
    let OSName = os.type();
    if (OSName == "Windows_NT") {
      let portList = await this.terminalExec(`netstat -ano | findstr :${port}`);
      if (portList.stdout) {
        result += "\n" + portList.stdout;
        let killingID = portList.stdout.replace(/\s+/g, " ");
        killingID = killingID.trim();
        killingID = killingID.split(" ");
        killingID = killingID[killingID.length - 1];
        let killPortRes = await this.terminalExec(
          `taskkill /PID ${killingID} /F`
        );
        //console.log("killPortRes --->", killPortRes, killingID);
        result += "\n" + killPortRes.stdout;
      } else {
        result = "Port number exists";
      }
      //console.log("portList", portList);
    } else if (OSName == "Linux") {
      let portList = await this.terminalExec(
        `sudo kill -9 \`sudo lsof -t -i:${port}\``
      );
      //console.log("portList", portList);
    }
    console.log(result);
    return result;
  }
  async createIsolateTCP(port = 8081, code = "") {
    let result = await this.terminalExec(`node theebot.js --createtcp ${port}`);
    return result;
  }
  deleteFile(file) {
    fs.unlinkSync(file);
    let result = file + " File deleted";
    console.log(result);
    return result;
  }
  readFile(file) {
    let filestring = fs.readFileSync(file, "utf8");
    console.log(filestring);
    return filestring;
  }
}
let theeBot = new TheeBot();
// let portno = 8081;
// if (typeof file_id != "undefined") {
//   portno = file_id;
// }
// theeBot.createTCP(portno);
