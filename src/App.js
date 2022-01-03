import { useState, useLayoutEffect } from "react";
import './App.css'
import Header from './Header.js';
import Main from './Main.js';

function App() {
    const [triggered, setTriggered] = useState(false)
    const [winHeight, setWinHeight] = useState(window.innerHeight)
    const [newFav, setNewFav] = useState(0)
    useLayoutEffect(() => {
        const checkHeight = () => {
            setWinHeight(window.innerHeight)
        }
        const isScrolling = () => {
            const bottomPosition = document.getElementById('iod').getBoundingClientRect().bottom - winHeight
            if (bottomPosition < (winHeight * 2)) {
                setTriggered(true)
            } else {
                setTriggered(false)
            }
        }
        window.addEventListener("scroll", isScrolling)
        window.addEventListener('resize', checkHeight)
        return () => {
            window.removeEventListener("scroll", isScrolling)
            window.removeEventListener('resize', checkHeight)
            setTriggered(false)
        }
    }, [])
    return (
        <div id="iod">
          <Header newFav={newFav} />
          <Main triggered={triggered} setTriggered={setTriggered} setNewFav={setNewFav} />
        </div>
    )
}
export default App;