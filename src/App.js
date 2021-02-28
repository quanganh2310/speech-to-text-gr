import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { Input } from 'antd';
import { Space, Button } from 'antd';
import { AudioOutlined } from '@ant-design/icons';

import ModelDropdown from './components/ModelDropdown';

import recognizeMic from './lib/speech-to-text/recognize-microphone';
import axios from 'axios';



const { TextArea } = Input;

const { Search } = Input;

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
        }
        this.onChangeLanguage = this.onChangeLanguage.bind(this);
        this.onEnterZoomApi = this.onEnterZoomApi.bind(this);
        this.onStopClick = this.onStopClick.bind(this);
    }

    componentDidMount() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.log("enumerateDevices() not supported.");
            return;
        }

        // List cameras and microphones.

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
                    this.setState({
                        text: data.alternatives[0].transcript
                    });
                    let transcript = data.alternatives[0].transcript;
                    if (this.state.zoom_end_point_url) {
                        let zoom_end_point_url = this.state.zoom_end_point_url + '&seq='+ seq_num + '&lang=' + languageCode;
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
                    }
                         
                });
                stream.on('error', function (err) {
                    console.log(err);
                });
                document.querySelector('#stop').onclick = stream.stop.bind(stream);
            }).catch(function (error) {
                console.log(error);
            });
    }

    onStopClick() {
        console.log('stopped');
        this.setState(
            {
                audioSource: null,
                text: '',
                model: 'en-US_BroadbandModel',
                speakerLabels: false,
                zoom_end_point_url: null,
            }
        )
    }

    render() {
        return (
            <>
                <div className="App">
                    <Space direction="vertical">
                        <ModelDropdown onChangeLanguage={this.onChangeLanguage.bind(this)} model={this.state.model}/>
                        <Space>
                            <Button onClick={this.onListenClick.bind(this)} type="primary" shape="round" icon={<AudioOutlined />}>
                                Record Audio
                            </Button>
                            <Button id='stop' onClick={this.onStopClick.bind(this)} type="primary" shape="round" danger>
                                Stop
                            </Button>
                        </Space>
                        <Search
                            placeholder="Input zoom api"
                            allowClear
                            enterButton="Submit"
                            size="large"
                            onSearch={this.onEnterZoomApi}
                        />
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
