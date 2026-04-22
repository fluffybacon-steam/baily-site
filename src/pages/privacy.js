import { useRef } from 'react';

const PrivacyPolicy = () => {
    const lastUpdated = "April 2026";
    const articleRef = useRef(null);

    return (
        <article ref={articleRef}>
            <h1 className="transition-target">Privacy</h1>
            <div className="content-block" style={{marginBottom: '50px'}}>
                <p >Last updated: {lastUpdated}</p>

                <section >
                    <p>
                    Hohman Digital LLC ("us", "we", or "our") operates hohmandigital.com (the "Site"). 
                    This page informs you of our policies regarding the collection, use, and disclosure of Personal Information 
                    we receive from users of the Site.
                    </p>
                    <p >
                    By using the Site, you agree to the collection and use of information in accordance with this policy.
                    </p>
                </section>

                <section >
                    <h2 >Information Collection and Use</h2>
                    <p>
                    While using our Site, we may ask you to provide us with certain personally identifiable information 
                    that can be used to contact or identify you. Personally identifiable information may include, but 
                    is not limited to:
                    </p>
                    <ul >
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Log Data (IP address, browser type, browser version, the pages of our Site that you visit)</li>
                    </ul>
                </section>

                <section >
                    <h2 >Log Data</h2>
                    <p>
                    Like many site operators, we collect information that your browser sends whenever you visit our Site ("Log Data"). 
                    This Log Data may include information such as your computer's Internet Protocol ("IP") address, 
                    browser type, browser version, the pages of our Site that you visit, the time and date of your visit, 
                    the time spent on those pages and other statistics.
                    </p>
                </section>

                <section >
                    <h2 >Cookies</h2>
                    <p>
                    Cookies are files with small amount of data, which may include an anonymous unique identifier. 
                    Cookies are sent to your browser from a web site and stored on your computer's hard drive.
                    </p>
                    <p >
                    Like many sites, we use "cookies" to collect information. You can instruct your browser to refuse 
                    all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, 
                    you may not be able to use some portions of our Site.
                    </p>
                </section>

                <section >
                    <h2 >Security</h2>
                    <p>
                    The security of your Personal Information is important to us, but remember that no method of 
                    transmission over the Internet, or method of electronic storage, is 100% secure. While we strive 
                    to use commercially acceptable means to protect your Personal Information, we cannot guarantee 
                    its absolute security.
                    </p>
                </section>

                <section >
                    <h2 >Service Providers</h2>
                    <p>
                    We may employ third-party companies and individuals to facilitate our service (such as hosting 
                    providers or analytics tools), to provide the service on our behalf, or to perform service-related 
                    services. These third parties have access to your Personal Information only to perform these tasks 
                    on our behalf and are obligated not to disclose or use it for any other purpose.
                    </p>
                </section>

                <section >
                    <h2 >Governing Law</h2>
                    <p>
                    This Privacy Policy and your use of the Site are governed by the laws of the Commonwealth of 
                    Pennsylvania, without regard to its conflict of law principles.
                    </p>
                </section>

                <section >
                    <h2 >Changes to This Privacy Policy</h2>
                    <p>
                    This Privacy Policy is effective as of {lastUpdated} and will remain in effect except with respect 
                    to any changes in its provisions in the future, which will be in effect immediately after being 
                    posted on this page.
                    </p>
                    <p >
                    We reserve the right to update or change our Privacy Policy at any time and you should check 
                    this Privacy Policy periodically.
                    </p>
                </section>

                <section >
                    <h2 >Contact Us</h2>
                    <p>
                    If you have any questions about this Privacy Policy, please contact us at:
                    </p>
                    <div >
                    <p >Hohman Digital LLC</p>
                    <p>baily@hohmandigital.com</p>
                    <p>Lancaster, Pennsylvania</p>
                    </div>
                </section>
            </div>
        </article>
    );
}

export default PrivacyPolicy;