import logo from "../images/logo.svg";
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import './../App.css';
import  { Redirect, useHistory } from 'react-router-dom'

const Home = (props) => {
	const [userData, setUserData] = useState({roomnumber:'',username:'', uerror: false, rerror: false})
	let history = useHistory();
	const redirectToMeeting = () => {
		if(userData.roomnumber==='' && userData.username==='') {
			console.log(1)
			setUserData({...userData, uerror: true, rerror: true})
		} else if(userData.username==='') {
			console.log(2)
			setUserData({...userData, uerror: true})
		} else if(userData.roomnumber==='') {
			console.log(userData)
			console.log(3)
			setUserData({...userData, rerror: true, uerror: false})
		} else if(userData.roomnumber && userData.username) {
			history.push(`/myroom/${userData.username}/${userData.roomnumber}`)
			
		}
	}


	return (
		<div className="home-container">
			<div className="entry_form">
				<input type="text" placeholder="Enter room number" onChange={(e) => setUserData({...userData, roomnumber:e.target.value, rerror:!e.target.value })} />
				{userData?.rerror && <p className="error">Enter your meeting room number</p>}
				<input type="text" placeholder="Enter your name" onChange={(e) => setUserData({...userData, username:e.target.value, uerror:!e.target.value})}/>
				{userData?.uerror && <p className="error">Enter your name</p>}
				<button  className="joinBtn" onClick={redirectToMeeting}>JOIN MEETING</button>	
			</div>
			
		</div>
	);
}

export default Home;
