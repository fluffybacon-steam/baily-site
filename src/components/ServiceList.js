export default function ServiceList() {
    return (
        <div className="service_list">
            <Item 
                icon=""
                title="Frontend"
            >
                <p>Frontend is part of website development and encompasses the visual, face-forwards part of the user experience.</p>

            </Item>
             <Item 
                icon=""
                title="Backend"
            >
                Lets test this out
            </Item>
            <Item 
                icon=""
                title="SEO"
            >
                Lets test this out
            </Item>
            <Item 
                icon=""
                title="Advertising"
            >
                Lets test this out
            </Item>
            <Item 
                icon=""
                title="Software"
            >
                Lets test this out
            </Item>
            <Item 
                icon=""
                title="Maintenance"
            >
                Lets test this out
            </Item>
        </div>
    )
}

const Item = (props) =>{
    console.log(props);
    return (
        <div class='service'>
            {props.icon && (props.icon)}
            <h2>{props.title}</h2>
            <div>{props.children}</div>
        </div>
    )
}