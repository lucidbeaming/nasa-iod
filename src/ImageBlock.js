import Image from "./Image.js"

function Imageblock(props) {
    return (
        <div id="main-block">
            {   
                props.imageList.map((image_item, index) => {
                        if(image_item !== undefined && image_item.media_type === "image") {
                            return(
                                <Image imgData={image_item} key={index} setNewFav={props.setNewFav}/>
                            )
                        } else {
                            return(null)
                        }
                })
            }
        </div>
    )
}

export default Imageblock