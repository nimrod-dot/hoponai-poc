'use client';

import { useRef, useState, useEffect } from 'react';
import { SimliClient } from 'simli-client';

export default function SimliDebugPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const simliClientRef = useRef<SimliClient | null>(null);
  
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSimliConnection = async () => {
    if (!videoRef.current || !audioRef.current) {
      addLog('ERROR: Video or audio ref not available');
      return;
    }

    addLog('Starting Simli connection test...');
    addLog(`API Key: ${process.env.NEXT_PUBLIC_SIMLI_API_KEY ? 'Present' : 'MISSING'}`);
    addLog(`Face ID: ${process.env.NEXT_PUBLIC_SIMLI_FACE_ID || 'MISSING'}`);

    try {
      const simliClient = new SimliClient();
      simliClientRef.current = simliClient;

      addLog('Initializing SimliClient...');

      simliClient.Initialize({
        apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY || "",
        faceID: process.env.NEXT_PUBLIC_SIMLI_FACE_ID || "",
        handleSilence: true,
        maxSessionLength: 3600,
        maxIdleTime: 600,
        session_token: "",
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        enableConsoleLogs: true,
        SimliURL: "",
        maxRetryAttempts: 100,
        retryDelay_ms: 2000,
        videoReceivedTimeout: 15000,
        enableSFU: true,
        model: "",
      });

      addLog('SimliClient initialized, setting up event listeners...');

      simliClient.on('connected', () => {
        addLog('✅ Simli CONNECTED');
        setIsConnected(true);
      });

      simliClient.on('disconnected', () => {
        addLog('❌ Simli DISCONNECTED');
        setIsConnected(false);
      });

      simliClient.on('failed', (reason: string) => {
        addLog(`❌ Simli FAILED: ${reason}`);
        setIsConnected(false);
      });

      simliClient.on('speaking', () => {
        addLog('🗣️ Avatar is speaking');
      });

      simliClient.on('silent', () => {
        addLog('🤫 Avatar is silent');
      });

      addLog('Calling start()...');
      await simliClient.start();
      addLog('start() completed');

      // Check status after 2 seconds
      setTimeout(() => {
        const status = simliClient.getConnectionStatus();
        setConnectionStatus(status);
        addLog(`Connection status: ${JSON.stringify(status)}`);
      }, 2000);

    } catch (err) {
      addLog(`❌ ERROR: ${err}`);
    }
  };

  const sendTestAudio = async () => {
    if (!simliClientRef.current) {
      addLog('ERROR: Simli client not initialized');
      return;
    }

    addLog('Sending test text to TTS...');
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello! This is a test message from Sarah.' }),
      });

      if (!response.ok) {
        addLog(`TTS API failed: ${response.status}`);
        return;
      }

      const audioBuffer = await response.arrayBuffer();
      addLog(`Got audio buffer: ${audioBuffer.byteLength} bytes`);

      const audioData = new Uint8Array(audioBuffer);
      simliClientRef.current.sendAudioData(audioData);
      addLog('Audio data sent to Simli');

    } catch (err) {
      addLog(`ERROR sending audio: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Simli Connection Debug</h1>

        <div className="grid grid-cols-2 gap-6">
          {/* Video Display */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Video Output</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ display: 'block' }}
                />
              </div>
              <audio ref={audioRef} autoPlay className="hidden" />
              
              <div className="mt-4 space-y-2">
                <div className={`px-3 py-2 rounded ${isConnected ? 'bg-green-600' : 'bg-red-600'} text-white text-sm`}>
                  Status: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </div>
                
                {connectionStatus && (
                  <div className="bg-gray-700 text-white text-xs p-3 rounded font-mono">
                    <div>Session Init: {connectionStatus.sessionInitialized ? 'Yes' : 'No'}</div>
                    <div>WebSocket: {connectionStatus.webSocketState}</div>
                    <div>Peer Connection: {connectionStatus.peerConnectionState}</div>
                    {connectionStatus.errorReason && (
                      <div className="text-red-400">Error: {connectionStatus.errorReason}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-x-2">
              <button
                onClick={testSimliConnection}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Test Connection
              </button>
              <button
                onClick={sendTestAudio}
                disabled={!isConnected}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Test Audio
              </button>
              <button
                onClick={() => {
                  simliClientRef.current?.close();
                  addLog('Connection closed');
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                Close Connection
              </button>
            </div>
          </div>

          {/* Logs */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Connection Logs</h2>
            <div className="bg-gray-800 rounded-lg p-4 h-[500px] overflow-y-auto">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`
                      ${log.includes('ERROR') || log.includes('❌') ? 'text-red-400' : ''}
                      ${log.includes('✅') ? 'text-green-400' : ''}
                      ${log.includes('🗣️') ? 'text-blue-400' : ''}
                      ${!log.includes('ERROR') && !log.includes('✅') && !log.includes('❌') && !log.includes('🗣️') ? 'text-gray-300' : ''}
                    `}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setLogs([])}
              className="mt-2 bg-gray-700 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="mt-6 bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
          <h3 className="text-yellow-400 font-semibold mb-2">Environment Variables Check:</h3>
          <div className="text-white text-sm space-y-1">
            <div>SIMLI_API_KEY: {process.env.NEXT_PUBLIC_SIMLI_API_KEY ? '✅ Set' : '❌ Missing'}</div>
            <div>SIMLI_FACE_ID: {process.env.NEXT_PUBLIC_SIMLI_FACE_ID ? `✅ ${process.env.NEXT_PUBLIC_SIMLI_FACE_ID}` : '❌ Missing'}</div>
            <div>ELEVENLABS_API_KEY: {process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}