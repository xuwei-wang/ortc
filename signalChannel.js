function signalChannel(params){
    let socket = null;
    let sink = params;
    function connectToServer(ip, port){
        this.socket = new window.WebSocket('ws://' + ip + ':' + port + '/');
        this.socket.onopen = onConnected;
        this.socket.onmessage = onMsg;
        this.socket.onerror = onWebsocketError;
        this.socket.onclose = onWebsocketClose;
        //this.socket.binaryType = "arraybuffer";  
    }
    function onConnected()
    {
        if(sink.handleConnectMsg)
            sink.handleConnectMsg("connected");
    }
    
    function onWebsocketClose(){
        console.log("onWebsocketClose");
    }

    function onMsg(event){
        var fr = new FileReader();
        let tem = null;
        let str = '';
        fr.onload = function (e) {
          //console.log(new Uint8Array(e.target.result)[0]);
          tem  = new Uint8Array(e.target.result);
          let len = tem.length;
          for (let i = 0; i < len; i++) {
                str += String.fromCharCode(tem[i]);
          }
          if(str.indexOf("heart beat") != -1)
          {
            //console.log(str);
          }
          else{
             let msg = JSON.parse(str);
          //console.log(str + ", length = " + str.length);
             if(sink.handleWebrtcMsg)
                sink.handleWebrtcMsg(msg);
          }
        };
        fr.readAsArrayBuffer(event.data);
    }

    function onWebsocketError(e)
    {
        console.log("onWebsocketError");
    }
    
    function sendMsg(msg, json){ 
        //let message = JSON.stringify({type:type, data:json});
        this.socket.send(msg);
    }
    
    this.connectToServer = connectToServer;
    this.sendMsg = sendMsg;
    this.socket = socket;
    this.handleMsg = null;
}
