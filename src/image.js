import { useState } from "react";

function Image(props) {
    const splitDate = (date) => {
        const picDate = new Date(date)
        return picDate.toUTCString().split(" ")
    }
    const [ , day, month, year ] = splitDate(props.imgData.date)
    const [ collapsed, setCollapsed ] = useState(" collapsed")
    const [ loading, setLoading ] = useState(" loading")
    const [ savedFav, setSavedFav ] = useState("")
    const toggleAbout = () => {
        if (collapsed !== " collapsed") {
            setCollapsed(" collapsed") 
        } else {
            setCollapsed("")
        }
    }
    const imageLoaded = () => {
        if (loading !== " loading") {
            setLoading(" loading") 
        } else {
            setLoading("")
        }
    }
    const setFavorite = (date) => {
        if (typeof(Storage) !== "undefined") {
            let favArr = JSON.parse(localStorage.getItem("nasaPics"))
            if (favArr !== null) {
                if (favArr.indexOf(date) === -1) {
                    favArr.push(date)
                    props.setNewFav(favArr.length)
                    setSavedFav("Saved in favorites")
                } else {
                    setSavedFav("Already saved")
                }
            } else {
                favArr = [ date ]
                props.setNewFav(favArr.length)
                setSavedFav("Your first favorite!")
            }
            favArr = JSON.stringify(favArr)
            localStorage.setItem("nasaPics", favArr)
        }
    }
    return (
        <div className="image-block">
            <div className="image-block-left">&nbsp;</div>
            <div className="image-block-inner">
                <a href={props.imgData.url} className={`img-anchor${ loading }`}>
                    <img src={props.imgData.url} alt="astronomical depiction of outer space" title={props.imgData.title} onLoad={ imageLoaded } />
                </a>
                <div className="title-bar">
                    <h3>{props.imgData.title}</h3>
                    <div className="toolbox">
                        <span className="fav-message">{ savedFav }</span>
                        <button className="fav-toggle" onClick={() => setFavorite(props.imgData.date) }>*</button>
                        <button className="info-toggle" onClick={ toggleAbout }>?</button>
                    </div>
                    <div className={`caption-box${ collapsed }`}>
                        <p>{props.imgData.explanation}</p>
                    </div>
                </div>
            </div>
            <div className="image-block-right">
                <div className="calendar-stamp">
                    <div className="month">{month}</div>
                    <div className="day">{parseInt(day, 10)}</div>
                    <div className="year">{year}</div>
                </div>
            </div>
        </div>
    )
}

export default Image