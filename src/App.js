import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import recognizeMic from 'watson-speech/speech-to-text/recognize-microphone';
import axios from 'axios';

let seq_num = 1;
let languageCode = 'en-US';

class App extends Component {
  constructor() {
    super()
    this.state = {}
  }

  componentDidMount() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
      return;
    }
    
    // List cameras and microphones.
    
    navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
      devices.forEach(function(device) {
        console.log(device.kind + ": " + device.label +
                    " id = " + device.deviceId);
      });
    })
    .catch(function(err) {
      console.log(err.name + ": " + err.message);
    });
  }

  onListenClick() {

    fetch('http://localhost:8000/api/v1/credentials')
      .then(function(response) {
          return response.text();
      }).then((token) => {
        var data = JSON.parse(token)
        console.log('token is', data.accessToken)
        var stream = recognizeMic({
            url: data.serviceUrl,
            token: data.accessToken,
            accessToken: data.accessToken,
            objectMode: true, // send objects instead of text
            extractResults: true, // convert {results: [{alternatives:[...]}], result_index: 0} to {alternatives: [...], index: 0}
            format: false // optional - performs basic formatting on the results such as capitals an periods
        });
        stream.on('data', (data) => {
          this.setState({
            text: data.alternatives[0].transcript
          });
          let transcript = data.alternatives[0].transcript;
          let zoom_end_point_url = 'https://wmcc.zoom.us/closedcaption?id=9086363314&ns=UXVhbmcgQW5oIE5ndXllbidzIFBlcnNvbmFsIE1l&expire=86400&sparams=id%2Cns%2Cexpire&signature=lnFyYigJ8ODsAY0QsS07Uioze1EKnwG4TGoWd8dpV-k.AG.5Mg6tXksPwDxd8bRErHu5pf7Rlctwc48d16flWcwEeVsGqS24kHDvmgpnDj88PEpuPY01Bo8Sic6lX6W-YatlrFTjlXwOQht6_RaZyCFyYdYLqo_EZva6Q.2Mbu_l51oTnerYgf_CGXVg.KR6FyEhZrdAqg0Mf' + '&seq='+ seq_num + '&lang=' + languageCode;
          axios({
            method: 'POST',
            url: zoom_end_point_url,
            data:  transcript,
            headers: {
                'Content-Type': 'text/plain'
            }
          })
          .then(function () {
              if (window.console && window.console.log) {
                  console.log('transcript sent to zoom:', transcript);
              }
          })
          .catch(function (error) {
              if (window.console && window.console.error) {
                  console.error('transcript sent to zoom:', transcript, 'error:', error);
              }
          });
          seq_num++;      
        });
        stream.on('error', function(err) {
            console.log(err);
        });
        document.querySelector('#stop').onclick = stream.stop.bind(stream);
      }).catch(function(error) {
          console.log(error);
      });
  }
  render() {
    return (
      <div className="App">
        <button onClick={this.onListenClick.bind(this)}>Listen to microphone</button>
        <div style={{fontSize: '40px'}}>{this.state.text}</div>

      </div>
    );
  }
}

export default App;
