
    // mr 싱크 관련
    // Start 요청에 대한 응답
    socket.on('requestStartTimeWithDelay', async (data) => {
      const { roomId } = data;
      // 모든 클라이언트에게 시작 시간 브로드캐스트
      io.to(roomId).emit('startTime', {
        startTime: Date.now() + 3000,
      });
      if (queueHelper.getQueueLength(roomId) > 0) {
        const songId = queueHelper.dequeueItem(roomId);
        const queryResult = await pool.query('SELECT mr_key, lyrics, pitch FROM songs WHERE id = $1', [songId]);
        if (queryResult.rows.length === 0) {
          socket.emit('error', {
            message: 'Loading song failed'
          });
          return;
        }
        const songData = queryResult.rows[0];
        const s3Url = await generateS3Url(songData.mr_key, 360);
        console.log('s3 url generated : ', s3Url);
        io.to(roomId).emit('playSong', {
          mrUrl: s3Url,
          lyrics: songData.lyrics,
          pitch: songData.pitch,
        });
      }
    });
    // Ping 요청에 대한 응답
    socket.on('ping', (data) => {
      socket.emit('pingResponse', {
        sendTime: data.sendTime,
        serverTime: Date.now()
      });
    });
    //  노래 재생 관련
    // Play 요청에 대한 응답
    socket.on('playSong', async (data) => {
      const { songId, roomId } = data;
      if (queueHelper.getQueueLength(roomId) === 0) {
        const queryResult = await pool.query('SELECT mr_key, lyrics, pitch FROM songs WHERE id = $1', [songId]);
        if (queryResult.rows.length === 0) {
          socket.emit('error', {
            message: 'Loading song failed'
          });
          return;
        }
        const songData = queryResult.rows[0];
        const s3Url = await generateS3Url(songData.mr_key, 360);
        console.log('s3 url generated : ', s3Url);
        io.to(roomId).emit('playSong', {
          mrUrl: s3Url,
          lyrics: songData.lyrics,
          pitch: songData.pitch,
        });
        queueHelper.enqueueItem(roomId, songId);
        io.to(roomId).emit('songAdded', {
          message: 'song added successfully',
          songId: songId,
        });
      } else {
        queueHelper.enqueueItem(roomId, songId);
        io.to(roomId).emit('songAdded', {
          message: 'song added successfully',
          songId: songId,
        });
      }
    });
 