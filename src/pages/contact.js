import {useEffect, useState, useRef} from 'react';
import {gsap} from 'gsap';
import { useGSAP } from '@gsap/react';
import {page_transition_last} from '@/lib/helper.js';
import { useRenderScene } from '@/context/RenderSceneContext';

const Contact = () => {
    const [contactMethod, setContactMethod] = useState('email');
    const articleRef = useRef(null);
        const { sceneRef, chevronRef } = useRenderScene();
        // const iconRef = useRef(null);
    
        useGSAP(() => {
            console.log("useGSAP running!");
    
        }, { dependencies: [] })

    return(
        <article ref={articleRef}>
            <h1 class='transition-target'>Contact</h1>
            <div data-fade-stagger="0">
            <p>Got a project, question, or site you&apos;d like us to check out? Let&apos;s talk.</p>
            <form
                action="https://submit-form.com/F0DFoMg5W"
            >
                <div className="flex-container">
                    <div className="input-wrapper name">
                        <label for="name">Name</label>
                        <input id="name" autocomplete="on" type="text" name="name" placeholder="John Doe" />
                    </div>
                    <div className="input-wrapper company">
                        <label for="company">Company</label>
                        <input id="company" autocomplete="on" type="text" name="company" placeholder="Doc Inc" />
                    </div>
                    <div className="input-wrapper method">
                        <label for="preferred_contact">Preferred contact method</label>
                        <select
                            id="preferred_contact"
                            name="preferred_contact"
                            value={contactMethod}
                            onChange={(e) => setContactMethod(e.target.value)}
                        >
                            <option value="email">Email</option>
                            <option value="call">Call</option>
                            <option value="text">Text</option>
                        </select>
                    </div>

                    {contactMethod === 'email' && (
                        <div className="input-wrapper">
                            <label for="email">Email</label>
                            <input autocomplete="on" id="email" type="email" name="email" placeholder="jdoe@gmail.com" />
                        </div>
                    )}

                    {(contactMethod === 'call' || contactMethod === 'text') && (
                        <div className="input-wrapper">
                            <label for="phone">Phone Number</label>
                            <input autocomplete="on" id="phone" type="tel" name="phone"  placeholder="717-555-5555" />
                        </div>
                    )}

                    <div className="input-wrapper message">
                        <label for="message">Message</label>
                        <textarea id="message" placeholder="How can we help?" name="message" ></textarea>
                    </div>

                </div>



                <button type="submit" >Submit</button>
            
            </form>
            </div>
        </article>
    )
}

export default Contact;