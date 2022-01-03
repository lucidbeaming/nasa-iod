import { useState, useLayoutEffect } from "react";

function Header(props) {
    const [collapsed, setCollapsed] = useState(" collapsed")
    const [favoriteCount, setFavoriteCount] = useState(" collapsed")
    const toggleAbout = () => {
        if (collapsed !== " collapsed") {
            setCollapsed(" collapsed")
        } else {
            setCollapsed("")
        }
    }
    const checkFav = () => {
        let favArr = JSON.parse(localStorage.getItem("nasaPics"))
        if (favArr !== null) {
            const count = favArr.length.toString()
            const plural = favArr.length > 1 ? "s" : ""
            setFavoriteCount(count + " favorite" + plural + " saved")
        } else {
            setFavoriteCount("No favorites saved yet")
        }
    }
    const showFavs = () => {
        let favArr = JSON.parse(localStorage.getItem("nasaPics"))
        if (favArr !== null) {
            favArr.forEach((item) => { console.log(item) })
        }
    }
    useLayoutEffect(() => {
        checkFav()
    }, [props])
    return (
        <header className="iod-header">
            <h1>NASA Image of the Day</h1>
            <p>{ favoriteCount } <button className={ favoriteCount.indexOf("No") ? "" : "hidden" } onClick={ showFavs }>SHOW</button></p>
            <button className="iod-link" onClick={ toggleAbout }>?</button>
            <div className={`app-info${ collapsed }`}>
                <p>This is a demonstration of inifinite scrolling in a React app. The official NASA image of the day site is <a href="https://www.nasa.gov/multimedia/imagegallery/iotd.html">https://www.nasa.gov/multimedia/imagegallery/iotd.html</a>.</p>
            </div>
        </header>
    )
}

export default Header