'use client';

import { useState, useEffect, useRef } from 'react';

const Blog = () => {
    const articleRef = useRef(null);
    const [catUrl, setCatUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCat = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://cataas.com/cat?json=true&t=${Date.now()}`);
            const data = await response.json();

            console.log('data',data);

            if (data && data.id) {
                setCatUrl(`https://cataas.com/cat/${data.id}`);
            } else {
                throw new Error("Invalid API response");
            }
        } catch (error) {
            console.error("The cat is out of my bag:", error);
            setCatUrl('https://cataas.com/cat'); 
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnotherOne = () => {
        const audio = new Audio('https://www.myinstants.com/media/sounds/another-one-dj-khaled.mp3');
        audio.play();
        fetchCat();
    };

    useEffect(() => {
        fetchCat();
    }, []);

    return (
        <article ref={articleRef} className="blog-placeholder">
            <h1 className="transition-target">Blog</h1>
            <div className="content-wrapper" data-fade-stagger="1">
                <p>Well, this is embarrassing... we haven&apos;t published anything yet.</p>
                <p>
                    As compensation, here is a random cat from 
                    <a href='https://cataas.com/' target="_blank" rel="noopener noreferrer"> cataas.com</a>
                </p>
                
                <div className="cat-container">
                    {isLoading ? (
                        <div className="loader">Finding a cat...</div>
                    ) : (
                        <img 
                            src={catUrl} 
                            alt="A random cat" 
                            className="cat-img"
                        />
                    )}
                </div>
                <br/>
                <button 
                    className='button-pill' 
                    onClick={handleAnotherOne}
                    disabled={isLoading}
                >
                    Another one
                </button>

                <p>Please come back at a later time when we are better prepared.</p>
            </div>
        </article>
    );
}

export default Blog;