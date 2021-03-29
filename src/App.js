import React, { Component } from 'react';
// import { desktopCapturer } from 'electron';
import './App.css';
import sampleVideo from './sintel-short.mp4';
import vttCaption from './sintel-en.vtt';

import { Input } from 'antd';
import { Space, Button } from 'antd';
import { AudioOutlined } from '@ant-design/icons';

import ModelDropdown from './components/ModelDropdown';


import recognizeMic from './lib/speech-to-text/recognize-microphone';
// import Vtt from 'vtt-creator';
// import axios from 'axios';

const { TextArea } = Input;

function initialize_test(videoElement, text){
    const tracks = videoElement.textTracks;
    const track = tracks[0];
    const cue = track.cues[0];
    
    cue.overflow = 'hidden';
    cue.size = 70;
    cue.text = text;
}

let displayMediaOptions = {
    video: {
      cursor: "always",
      frameRate: { ideal: 60, max: 120 },
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100,
    }
  };

let seq_num = 1;
let languageCode = 'en-US';

class App extends Component {
    constructor() {
        super()
        this.state = {
            audioSource: null,
            text: '',
            model: 'en-US_BroadbandModel',
            speakerLabels: false,
            zoom_end_point_url: null,
            stream: undefined,
            vtt: undefined,
        }
        this.onChangeLanguage = this.onChangeLanguage.bind(this);
        this.onEnterZoomApi = this.onEnterZoomApi.bind(this);
        this.onResetClick = this.onResetClick.bind(this);
        this.stopCapture = this.stopCapture.bind(this);
        this.startCapture = this.startCapture.bind(this);
    }

    componentDidMount() {
        navigator.mediaDevices.enumerateDevices()
            .then(function (devices) {
                devices.forEach(function (device) {
                    console.log(device.kind + ": " + device.label +
                        " id = " + device.deviceId);
                });
            })
            .catch(function (err) {
                console.log(err.name + ": " + err.message);
            });
    }

    onChangeLanguage(e) {
        console.log(e);
        let model = e;
        this.setState({
            model: model
        });
    }

    onEnterZoomApi(value) {
        console.log(value);
        this.setState({
            zoom_end_point_url: value
        });
    }

    onListenClick() {

        fetch('http://localhost:8000/api/v1/credentials')
            .then(function (response) {
                return response.text();
            }).then((token) => {
                var data = JSON.parse(token)
                console.log('token is', data.accessToken)
                var stream = recognizeMic({
                    mediaStream: this.state.stream,
                    model: this.state.model,
                    url: data.serviceUrl,
                    token: data.accessToken,
                    accessToken: data.accessToken,
                    speakerLabels: false,
                    objectMode: true, // send objects instead of text
                    extractResults: true, // convert {results: [{alternatives:[...]}], result_index: 0} to {alternatives: [...], index: 0}
                    format: true // optional - performs basic formatting on the results such as capitals an periods
                });
                stream.on('data', (data) => {
                    let transcript = data.alternatives[0].transcript;
                    this.setState({
                        text: data.alternatives[0].transcript,
                    });
                    const trackElement = document.getElementById('caption-change-track');
                    const videoElement = document.getElementById('video');
                    
                    trackElement.addEventListener('loaded',initialize_test(videoElement, transcript),false); // Bug in FF31 MAC: wrong event name
                    trackElement.addEventListener('load',initialize_test(videoElement, transcript),false);
                    
                    
                    // if (this.state.zoom_end_point_url) {
                    //     let zoom_end_point_url = this.state.zoom_end_point_url + '&seq='+ seq_num + '&lang=' + languageCode;
                    //     axios({
                    //       method: 'POST',
                    //       url: zoom_end_point_url,
                    //       data:  transcript,
                    //       headers: {
                    //           'Content-Type': 'text/plain'
                    //       }
                    //     })
                    //     .then(function () {
                    //         if (window.console && window.console.log) {
                    //             console.log('transcript sent to zoom:', transcript);
                    //         }
                    //     })
                    //     .catch(function (error) {
                    //         if (window.console && window.console.error) {
                    //             console.error('transcript sent to zoom:', transcript, 'error:', error);
                    //         }
                    //     });
                    //     seq_num++; 
                    // }
                         
                });
                stream.on('error', function (err) {
                    console.log(err);
                });
                document.querySelector('#stop').onclick = stream.stop.bind(stream);
            }).catch(function (error) {
                console.log(error);
            });
    }

    onResetClick() {
        console.log('stopped');
        this.setState(
            {
                audioSource: null,
                text: '',
                speakerLabels: false,
                zoom_end_point_url: null,
                stream: undefined
            }
        )
    }

    async startCapture() {    
        try {
          let stream;  
          stream = document.querySelector('#video').srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
          this.setState({
            stream: stream
          });
          console.log(stream)
        //   dumpOptionsInfo();
        } catch(err) {
          console.error("Error: " + err);
        }
    }

    stopCapture(evt) {
        let tracks = document.querySelector('#video').srcObject.getTracks();
      
        tracks.forEach(track => track.stop());
        document.querySelector('#video').srcObject = null;
    }

    render() {
        console.log('This is render');
        return (
            <>
                <div className="App">
                    <Space direction="vertical">
                        <Space>
                            <Button id='start' 
                            onClick={this.startCapture.bind(this)}
                             type="primary" shape="round">
                                Capture screen
                            </Button>
                            <Button id='stopCapture' onClick={this.stopCapture.bind(this)} type="primary" shape="round" danger>
                                Stop
                            </Button>
                        </Space>
                        {/* <video id="video" autoPlay controls muted>

                        </video> */}
                        <video id="video" autoPlay controls muted>
                            <source src={sampleVideo} type="video/mp4"/>
                            <track 
                                id="caption-change-track"
                                kind="captions"
                                srcLang="en"
                                src={vttCaption}
                                onLoadedMetadata={this.onTrackLoad}
                                
                                default
                            />
                        </video>
                        <ModelDropdown onChangeLanguage={this.onChangeLanguage.bind(this)} model={this.state.model}/>
                        <Space>
                            <Button onClick={this.onListenClick.bind(this)} type="primary" shape="round" icon={<AudioOutlined />}>
                                Record Audio
                            </Button>
                            <Button id='stop' type="primary" shape="round" danger>
                                Stop
                            </Button>
                            <Button id='reset' onClick={this.onResetClick.bind(this)} type="primary" shape="round" danger>
                                Reset
                            </Button>
                        </Space>
                        {/* <Search
                            placeholder="Input zoom api"
                            allowClear
                            enterButton="Submit"
                            size="large"
                            onSearch={this.onEnterZoomApi}
                        /> */}
                        <div>
                            <TextArea
                                value={this.state.text}
                                placeholder="Text"
                                autoSize={{ minRows: 3 }}
                                style={{ fontSize: '30px', width: '700px' }}
                            />
                        </div>
                    </Space>
                </div>
            </>
        );
    }
}

export default App;
