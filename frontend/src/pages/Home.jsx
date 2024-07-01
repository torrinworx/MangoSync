import { h, Typography, Button, TextArea } from "destamatic-ui";

import { Observer } from "destam-dom";

const Home = ({ Shared }) => {
    const disabled = Observer.mutable(false);

    return <div 
        $style={{
            // backgroundColor: "#FFB703",
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            position: 'absolute',
            inset: '0px',
        }}
    >

    <Typography variant='h1' >Hello World!</Typography>
    <Button type='text' label="Button" disabled={disabled} onClick={() => disabled.set(true)} />
    <Button type='contained' label="Button" disabled={disabled} onClick={() => disabled.set(true)} />
    <Button type='outlined' label="Button" disabled={disabled} onClick={() => disabled.set(true)} />
    <TextArea />
    </div>;
};

export default Home;
