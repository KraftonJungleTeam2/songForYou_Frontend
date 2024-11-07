{isCreatingRoom ? (
  <RoomCreation onCancel={() => setIsCreatingRoom(false)} />
) : (
  <div className="main-area">
    <button className="page-button" onClick={handlePreviousPage}>
      <i className="fa-solid fa-circle-chevron-left"></i>
    </button>

    <div className="room-list">
      {roomCards.map((room, index) => (
        <div className={`room-card ${room.empty ? 'empty' : ''}`} key={room.empty ? `empty-${index}` : room.id}>
          {room.empty ? (
            <div className="room-info-empty">빈 방</div>
          ) : (
            <div onClick={(e) => handlePlay(e, room.id, room.password)} className="room-content">
              <img className="thumbnail" src={room.image} alt={`Thumbnail for ${room.roomTitle}`} />
              <div className="room-info">
                <h3>{room.roomTitle}</h3>
                <p>Players: {room.users.length}/{room.max_user}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>

    <button className="page-button" onClick={handleNextPage}>
      <i className="fa-solid fa-circle-chevron-right"></i>
    </button>
  </div>
)}

<div className={`bottom-buttons ${isSidebarOpen ? 'shifted' : ''}`}>
  <button className='quick-join'>빠른 입장</button>
  <button className='sort-by'>정렬 조건</button>
  <button className='create-room' onClick={() => setIsCreatingRoom(true)}>
    방 생성
  </button>
  <button className='refresh' onClick={fetchRooms}>
    새로고침
  </button>
</div>