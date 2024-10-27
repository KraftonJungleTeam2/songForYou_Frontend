// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../Context/AuthContext';
// import { useNavigate, useLocation  } from 'react-router-dom';
// import '../css/TopBar.css';
// import axios from 'axios';

// function TopBar() {
  
//   return (
//     <div className='top-bar'>
//       <div className='right-section'>
//         <button className='logout-button' onClick={Logout}>
//           로그아웃
//         </button>
//         <div className='user-avatar'>A</div>
//         <div className='user-details'>
//           <h3>{userData.name}</h3>
//           <p>{userData.email}</p>
//         </div>
//         <button className='settings-button' onClick={GoSetting}>
//           ⚙️
//         </button>
//       </div>
//       {error && <p className='error-message'>{error}</p>}
//     </div>
//   );
// }

// export default TopBar;
