import React from 'react';

import './App.css';
import Home from './components/Home';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import MyRoom from './components/MeetingRoom';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <Router>
          <div className="main-container">
            <div className='navbar'>
              <div className='centertext'>
                <h1>Meeting Information</h1>
              </div>
            </div>
            <React.Fragment>
              <Switch>
                <Route path="/" exact component={Home} />
                <Route path="/myroom/:username/:roomid" component={MyRoom} />
                
              </Switch>
            </React.Fragment>
          </div>
        </Router>)
  }
}

export default App;