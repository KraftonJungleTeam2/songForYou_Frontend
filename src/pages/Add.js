import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Add() {
  const [item, setItem] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 여기에 항목 추가 로직을 구현합니다.
    console.log('Item added:', item);
    setItem('');
  };

  return (
    <div>
      <h2>Add Page</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Enter item to add"
        />
        <button type="submit">Add Item</button>
      </form>
    </div>
  );
}

export default Add;