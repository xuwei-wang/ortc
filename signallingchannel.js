/*
 *   Copyright (c) Microsoft Corporation
 *   All Rights Reserved        
 *   Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 *   the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *   THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED,
 *   INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
 *   MERCHANTABLITY OR NON-INFRINGEMENT. 
 *   
 *   See the Apache 2 License for the specific language governing permissions and limitations under the License.
 */


(function (global) {
    'use strict';

    var self = null;
    var clientSocket = null;

    function SignallingChannel() {
        EventTarget.call(this);

        self = this;
        this.defineEventProperty('message');

        start();
    }

    Object.inherits(SignallingChannel, EventTarget);

    // send data to other peer
    SignallingChannel.prototype.send = function (data) {

        data = JSON.parse(data);

        var selfInfo = data.selfInfo;
        var peerInfo = data.peerInfo;

        if (data.clientlist) {
            console.log('SEND clientlist');

            clientSocket.emit('message',
            {
                kind: 'clientlist'
            });

            return;
        }

        if (data.peervalidaterequest) {
            console.log('SEND peervalidaterequest');

            clientSocket.emit('message',
            {
                kind: 'peervalidaterequest',
                details: data.peervalidaterequest
            });

            return;
        }

        if (data.connectrequest) {
            console.log('SEND connectrequest');

            clientSocket.emit('message',
            {
                kind: 'connectrequest',
                selfInfo: selfInfo,
                peerInfo: peerInfo
            });

            return;
        }

        if (data.connectresponse) {
            console.log('SEND connectresponse');

            clientSocket.emit('message',
            {
                kind: 'connectresponse',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                response: data.connectresponse
            });

            return;
        }

        if (data.params) {
            console.log('SEND params');

            clientSocket.emit('message',
            {
                kind: 'params',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                params: data.params
            });

            return;
        }

        if (data.candidate) {

            console.log('SEND candidate');

            clientSocket.emit('message',
            {
                kind: 'remotecandidate',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                candidate: data.candidate
            });

            return;
        }

        if (data.candidate_2) {

            console.log('SEND candidate_2');

            clientSocket.emit('message',
            {
                kind: 'remotecandidate_2',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                candidate_2: data.candidate_2
            });

            return;
        }

        if (data.error) {

            console.log('SEND error');

            clientSocket.emit('message',
            {
                kind: 'error',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                error: data.error
            });

            return;
        }

        if (data.disconnect) {

            console.log('SEND disconnect');

            clientSocket.emit('message',
            {
                kind: 'disconnect',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                error: data.error
            });

            return;
        }
    };

    // close channel
    SignallingChannel.prototype.close = function () {
        console.log('SignallingChannel: close');
    };

    // open channel
    function start() {

        if (!clientSocket) {
            clientSocket = connect(handleSocketIoMsg, function () {
                console.log('RECV: disconnect');
                dispatchMessage(JSON.stringify({ socket: 'disconnect' }));
            });
        }
        else {
            console.log('SEND: register');

            clientSocket.emit('message', {
                kind: 'register',
                friendlyName: global.fName
            });
        }
    }

    // dispatch received messages
    function dispatchMessage(msg, type) {

        var evt = new Event('message');
        evt.data = msg;
        self.dispatchEvent(evt);
    }

    // handle websocket messages
    function handleSocketIoMsg(e) {

        if (e.kind === 'connect') {
            console.log('RECV: connect');

            clientSocket.emit('message', { kind: 'register', friendlyName: global.fName });
        }
        else if (e.kind === 'registerdone') {
            console.log('RECV: registerdone');
            dispatchMessage(JSON.stringify({ registerdone: e.registerationdetails }));
        }
        else if (e.kind === 'clientlist') {
            console.log('RECV: clientlist');
            dispatchMessage(JSON.stringify({ clientlist: e.clients }));
        }
        else if (e.kind === 'peervalidateresponse') {
            console.log('RECV: peervalidateresponse');
            dispatchMessage(JSON.stringify({ peervalidateresponse: e.response }));
        }
        else if (e.kind === 'connectrequest') {
            console.log('RECV: connectrequest');
            dispatchMessage(JSON.stringify({ connectrequest: { peerInfo: e.peerInfo } }));
        }
        else if (e.kind === 'connectresponse') {
            console.log('RECV: connectresponse');
            dispatchMessage(JSON.stringify({ connectresponse: e.response }));
        }
        else if (e.kind === 'start') {
            console.log('RECV: start');
            dispatchMessage(JSON.stringify({ start: 'start', dtlsrole: e.dtlsrole }));
        }
        else if (e.kind === 'remotecandidate') {
            console.log('RECV: remotecandidate');
            dispatchMessage(JSON.stringify({ candidate: e.candidate }));
        }
        else if (e.kind === 'remotecandidate_2') {
            console.log('RECV: remotecandidate_2');
            dispatchMessage(JSON.stringify({ candidate_2: e.candidate_2 }));
        }
        else if (e.kind === 'disconnect') {
            console.log('RECV: disconnect');
            dispatchMessage(JSON.stringify({ disconnect: 'disconnect' }));
        }
        else if (e.kind === 'params') {
            console.log('RECV: params');
            dispatchMessage(JSON.stringify({ params: e.params }));
        }
        else if (e.kind === 'error') {
            console.log('RECV: error');
            dispatchMessage(JSON.stringify({ error: e.error || "remote error" }));
        }
        else if (e.kind === 'duplicate') {
            console.log('RECV: duplicate');
            dispatchMessage(JSON.stringify({ duplicate: true }));
        }
    }

    // connect to websocket
    function connect(messageHandlerCb, disconnectCb) {
        // var hostname = window.document.location.hostname;
        // var port = window.document.location.port;
        // var url = 'https://' + hostname + ':' + port;

        var resultSocket = io.connect(window.document.location.origin, { 'force new connection': true }); // as per https://github.com/LearnBoost/socket.io-client/issues/318

        resultSocket.on('message', messageHandlerCb);

        if (messageHandlerCb) {
            resultSocket.on('connect', function () {
                messageHandlerCb({ kind: 'connect' });
            });
        }

        if (disconnectCb) {
            resultSocket.on('disconnect', function () {
                disconnectCb({ kind: 'disconnect' });
            });
        }

        return resultSocket;
    }


    global.SignallingChannel = SignallingChannel;


}(typeof window === 'object' ? window : global));
