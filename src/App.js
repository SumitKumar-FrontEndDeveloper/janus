import React from 'react';

import './App.css';
import Home from './components/Home';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import MyRoom from './components/MyRoom';

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
                <h1>Sumit Kumar</h1>
              </div>
              <div className='centertext'>
                <h3>Hi ! K toon</h3>
              </div>
            </div>
            <React.Fragment>
              <Switch>
                <Route path="/" exact component={Home} />
                <Route path="/myroom" component={MyRoom} />
                
              </Switch>
            </React.Fragment>
          </div>
        </Router>)
  }
}

export default App;