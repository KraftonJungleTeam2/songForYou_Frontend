<div className='sing-area' ref={containerRef}>
<div className='information-area'>
  <p>현재곡</p>
  <p>가수</p>
  <p>곡번호</p>
</div>
{/* 오디오 상태 표시 */}
{/* <div className="audio-status">
            {audioLoaded ? (
                <div>
                    <p>오디오 로드 완료 - 길이: {duration.toFixed(2)}초</p>
                    <p>현재 상태: {isPlaying ? '재생 중' : '정지'}</p>
                    <p>재생 위치: {playbackPosition.toFixed(2)}초</p>
                    <p>실제 지연 시간: {starttime ? starttime.toFixed(5) : "측정 중"}초</p>
                </div>
            ) : (
                <p>오디오 로딩 중...</p>
            )}
        </div> */}

<div className='pitch-graph-multi'>
  <PitchGraph dimensions={dimensions} realtimeData={entireGraphData} multiRealDatas={pitchArraysRef.current} referenceData={entireReferData} dataPointCount={dataPointCount} currentTimeIndex={playbackPosition * 40} songimageProps={reservedSongs[0]} score={instantScore} />
</div>

{/* Seek Bar */}
{/* <div className='seek-bar-container'>
<input type='range' min='0' max={duration} step='0.025' value={playbackPosition} className='range-slider' disabled={!audioLoaded} />
<div className='playback-info'>
  {playbackPosition.toFixed(3)} / {duration.toFixed(2)} 초
</div>
</div> */}

{/* 현재 재생 중인 가사 출력 */}
<div className='karaoke-lyrics'>
  <p className='prev-lyrics'>{prevLyric}</p>
  <NowPlayingLyrics
    segment={currSegment}
    playbackPosition={playbackPositionRef.current}
  />
  <p className='next-lyrics'>{nextLyric}</p>
</div>

<div className='button-area'>
  {/* 시작 버튼 */}
  <button onClick={isPlaying ? handleStopClick : handleStartClick} disabled={!audioLoaded || isWaiting || !pitchLoaded || !lyricsLoaded} className={`button start-button ${!audioLoaded || isWaiting ? 'is-loading' : ''}`}>
    {audioLoaded ? (isPlaying ? '노래 멈추기' : '노래 시작') : '로딩 중...'}
  </button>

  {/* 마이크 토글 버튼 */}
  <button
    className={`button mic-button`} // 버튼 스타일 변경
    onClick={isMicOn ? micOff : micOn}>
    {isMicOn ? '마이크 끄기' : '마이크 켜기'}
  </button>

  <button className='button reservation-button' onClick={OnPopup}>
    시작하기 or 예약하기
  </button>
  <button className='button' onClick={() => setUseCorrection(!useCorrection)}>
    {useCorrection ? '보정끄기' : '보정켜기'}
  </button>
  <input type='range' className='range-slider' min={0} max={1} step={0.01} defaultValue={0.5} onChange={handleVolumeChange} aria-labelledby='volume-slider' />
  <h3>DEBUG playoutDelay: {playoutDelay.toFixed(2)}, jitterDelay: {jitterDelay.toFixed(2)}, listenerNetworkDelay: {listenerNetworkDelay.toFixed(2)}</h3>
  <h3>audioDelay: {audioDelay.toFixed(2)}, singerNetworkDelay: {singerNetworkDelay.toFixed(2)}, optionDelay: {optionDelay.toFixed(2)}</h3>
  <h3>latencyOffset: {latencyOffset.toFixed(2)}</h3>
  <input type='number' value={optionDelay} onChange={(e) => setOptionDelay(parseFloat(e.target.value))}></input>
  {/* 오디오 엘리먼트들 */}
  <div className='remote-audios' style={{ display: 'none' }}>
    {players.map((player) => (
      <audio key={player.userId} id={`remoteAudio_${player.userId}`} autoPlay />
    ))}
  </div>
</div>

{/* 조건부 렌더링 부분 popup */}
{showPopup && <ReservationPopup roomid={roomId} socket={socketRef.current} onClose={closePopup} reservedSongs={reservedSongs} setReservedSongs={setReservedSongs} songLists={songLists} nextData={nextDataRef.current} />}

{/* AudioPlayer 컴포넌트 */}
<AudioPlayer ref={audioPlayerRef} isPlaying={isPlaying} setIsPlaying={setIsPlaying} audioBlob={mrDataBlob} setAudioLoaded={setAudioLoaded} setDuration={setDuration} onPlaybackPositionChange={setPlaybackPosition} starttime={starttime} setStarttime={setStarttime} setIsWaiting={setIsWaiting} setIsMicOn={setIsMicOn} latencyOffset={latencyOffset} musicGain={musicGain} playoutDelay={playoutDelay} setPlayoutDelay={setPlayoutDelay} />
</div>

<div className='players-chat'>

<PlayerCard players={players} socketId={socketId} score={score} playerVolumeChange={playerVolumeChange}/>

<div className='chat-area'>
  {' '}
  <div className='chat-container'>
    <div className='messages'>
      {messages.map((msg, index) => (
        <div key={index} className='message'>
          <span className='text'>{msg.text}</span>
          <div className='time'>{new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
    <div className='input-area'>
      <input type='text' value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder='메시지를 입력하세요...' />
      <button onClick={sendMessage}>전송</button>
    </div>
  </div>
</div>
</div>