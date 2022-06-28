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

// class Home extends React.Component {
// 		constructor(props) {
// 				super(props);
// 				this.handleJoinRoom = this.handleJoinRoom.bind(this);
// 		}
// 		componentDidMount() {
// 		}

// 		handleJoinRoom() {
// 				this.props.history.push('/room');
// 		}

// 		render() {
// 				return (
// 						<div className="App">
// 								<header className="App-header">
// 										<img src={logo} className="App-logo" alt="logo" />
// 										<p>
// 												Welcome to <code>Reunitus</code> video room (powered by Janus).
// 										</p>
// 										<button
// 												onClick={this.handleJoinRoom}
// 										>
// 												Join Room
// 										</button>
// 								</header>
// 						</div>
// 				)
// 		}
// }

// export default Home;