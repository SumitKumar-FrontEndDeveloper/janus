import logo from "../images/logo.svg";
import React from 'react';
import { Link } from "react-router-dom";
import './../App.css';

const Home = (props) => {
	return (
		<div className="home-container">
			<Link to="/myroom" className="joinBtn">JOIN MEETING</Link>	
		</div>
	);
}

export default Home;
