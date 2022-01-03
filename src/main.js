import { useLayoutEffect, useRef, useState } from 'react'
import Imageblock from "./image-block.js"

const apiKey = process.env.REACT_APP_NASA_API_KEY

function useNasaImages(param) {
    const [imageUpdate, setImageUpdate] = useState([])
    const [loading, setLoading] = useState(false)
    const callNASA = () => {
        setLoading(true)
        const criteria = "start_date=" + param.start + "&end_date=" + param.end
        const nasaQuery = "https://api.nasa.gov/planetary/apod?" + criteria + "&api_key=" + apiKey
        fetch(nasaQuery)
            .then(res => res.json())
            .then(res => res.reverse())
            .then(setImageUpdate)
            .then(() => setLoading(false))
            .catch((error) => console.log("fetch error", error))
    }
    return [imageUpdate, loading, callNASA]
}

const dateRange = (imageCount) => {
    const endOffset = imageCount ? 1 : 0
    const dayMultiple = 1000 * 60 * 60 * 24
    const offset = new Date()
    let end = {}
    if (imageCount > 0) {
        end = new Date(offset.getTime())
    } else {
        end = new Date(offset.getTime() - (offset.getTimezoneOffset() * 60000))
    }
    const endTime = end.getTime() - ((imageCount + endOffset) * dayMultiple)
    const startTime = endTime - (6 * dayMultiple)
    const startDate = new Date(startTime).toISOString().split('T')[0]
    const endDate = new Date(endTime).toISOString().split('T')[0]
    return [startDate, endDate]
}

function Main(props) {
    const initializing = useRef(true)
    const [allImages, setAllImages] = useState([])
    let [from, to] = dateRange(allImages.length)
    let criteria = { start: from, end: to }
    const [imageUpdate, loading, callNASA] = useNasaImages(criteria)
    useLayoutEffect(() => {
        if (initializing.current && !allImages.length) {
            initializing.current = false
            callNASA(criteria)
        }
        if (!initializing.current && !allImages.length && !loading) {
            setAllImages(imageUpdate)
        } else if (!initializing.current && allImages.length && !loading) {
            setAllImages(allImages.concat(imageUpdate))
        }
    }, [loading])
    useLayoutEffect(() => {
        if (props.triggered && allImages.length) {
            callNASA(criteria)
        }
    }, [props.triggered])
    return (
        <div id="main">
            <Imageblock imageList={allImages} setNewFav={props.setNewFav} />
            <div className={`iod-loader${ loading || props.triggered ? " active" : "" }`}></div>
        </div>
    )
}



export default Main