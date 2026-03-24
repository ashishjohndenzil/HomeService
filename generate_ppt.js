const pptxgen = require("pptxgenjs");
let pres = new pptxgen();

// Title format
let titleOpts = { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 32, bold: true, color: "363636", border: [0,0,{pt: 2, color: "20e3b2"},0] };

// 1. Title Slide
let slide = pres.addSlide();
slide.background = { color: "1b2735" };
slide.addText("Home Service\nBooking System", { x: 1, y: 2, w: 8, fontSize: 48, bold: true, color: "ffffff", align: "center" });
slide.addText("Smart and Flexible Platform", { x: 1, y: 3.5, w: 8, fontSize: 24, color: "20e3b2", align: "center" });
slide.addText("Presented by: Ashish John", { x: 1, y: 4.8, w: 8, fontSize: 18, color: "cccccc", align: "center" });

function addRegularSlide(titleStr, bodyStr, bulletsArr) {
    let s = pres.addSlide();
    s.addText(titleStr, titleOpts);
    let yOffset = 1.5;
    if (bodyStr) {
        s.addText(bodyStr, { x: 0.5, y: 1.5, w: 9, fontSize: 16, color: "666666" });
        yOffset = 2.5; // push bullets down
    }
    if (bulletsArr && bulletsArr.length > 0) {
        let b = bulletsArr.map(t => ({ text: t, options: { bullet: true } }));
        s.addText(b, { x: 0.5, y: yOffset, w: 9, fontSize: 20, color: "363636", margin: 10 });
    }
}

addRegularSlide("2. Introduction", 
    "A Home Service Booking System is a digital platform that enables users to book household services online in an easy and efficient way. It connects customers with skilled service providers such as electricians, plumbers, cleaners, and technicians.",
    ["Eliminates manual searching", "Provides convenience and accessibility", "Available anytime and anywhere"]);

addRegularSlide("3. Problem Statement", 
    "In the traditional system, users face several challenges when trying to book home services. Finding reliable professionals is difficult, and the process is often time-consuming.",
    ["Lack of trusted service providers", "Time-consuming booking process", "No transparency in pricing", "No proper scheduling system"]);

addRegularSlide("4. Proposed Solution", 
    "The system provides an online platform where users can easily search, book, and manage home services. It ensures verified service providers and smooth service delivery.",
    ["Online booking system", "Verified professionals", "Easy scheduling", "Secure payment system"]);

addRegularSlide("5. Objectives", 
    "The main objective of this system is to simplify and modernize the process of booking home services.",
    ["Provide an easy-to-use interface", "Ensure reliable and quality services", "Save time and effort", "Improve user satisfaction"]);

addRegularSlide("6. Scope of the System", 
    "This system is designed for multiple users including customers, service providers, and administrators. It supports a wide range of home services and can be extended further.",
    ["Multi-user platform", "Covers multiple service categories", "Expandable to mobile apps", "Supports real-time operations"]);

addRegularSlide("7. System Architecture", 
    "The system follows a client-server architecture. The frontend interacts with the backend, which processes requests and communicates with the database.",
    ["Frontend: HTML, CSS, JavaScript", "Backend: PHP", "Database: MySQL"]);

addRegularSlide("8. Modules of the System", 
    "The system is divided into three main modules to ensure proper functionality and management.",
    ["User Module", "Admin Module", "Service Provider Module"]);

addRegularSlide("9. User Module", 
    "The user module allows customers to interact with the system and book services easily.",
    ["Register and login", "Browse services", "Book services", "View booking history"]);

addRegularSlide("10. Admin Module", 
    "The admin module controls the entire system and ensures smooth operation.",
    ["Manage users and providers", "Add/update/delete services", "Monitor bookings", "Generate reports"]);

addRegularSlide("11. Service Provider Module", 
    "This module allows service providers to manage their tasks and availability.",
    ["Accept or reject bookings", "Update availability", "Manage profile and services", "View assigned jobs"]);

addRegularSlide("12. Key Features", 
    "The system includes various features that enhance usability and efficiency.",
    ["User-friendly interface", "Secure authentication", "Real-time booking", "Online payment integration", "Ratings and reviews"]);

addRegularSlide("13. Database Design", 
    "The system uses a relational database to store and manage data efficiently.",
    ["Users Table", "Services Table", "Bookings Table", "Payments Table", "Maintains relationships between data"]);

addRegularSlide("14. Technologies Used", 
    "The system is developed using modern web technologies.",
    ["Frontend: HTML, CSS, JavaScript", "Backend: PHP", "Database: MySQL"]);

// 15. System Screenshots (Customer View)
let s15 = pres.addSlide();
s15.addText("15. System Preview (Customer)", titleOpts);
s15.addShape(pres.ShapeType.rect, { x: 1, y: 1.5, w: 3.5, h: 3, fill: "F0F0F0", line: { color: "CCCCCC", width: 1 } });
s15.addText("📷 [Insert Customer Dashboard Screenshot]", { x: 1, y: 1.5, w: 3.5, h: 3, align: "center", color: "999999" });
s15.addShape(pres.ShapeType.rect, { x: 5.5, y: 1.5, w: 3.5, h: 3, fill: "F0F0F0", line: { color: "CCCCCC", width: 1 } });
s15.addText("📷 [Insert Booking Form Screenshot]", { x: 5.5, y: 1.5, w: 3.5, h: 3, align: "center", color: "999999" });

// 16. System Screenshots (Admin & Provider View)
let s16 = pres.addSlide();
s16.addText("16. System Preview (Admin & Provider)", titleOpts);
s16.addShape(pres.ShapeType.rect, { x: 1, y: 1.5, w: 3.5, h: 3, fill: "F0F0F0", line: { color: "CCCCCC", width: 1 } });
s16.addText("📷 [Insert Admin Dashboard Screenshot]", { x: 1, y: 1.5, w: 3.5, h: 3, align: "center", color: "999999" });
s16.addShape(pres.ShapeType.rect, { x: 5.5, y: 1.5, w: 3.5, h: 3, fill: "F0F0F0", line: { color: "CCCCCC", width: 1 } });
s16.addText("📷 [Insert Provider Dashboard Screenshot]", { x: 5.5, y: 1.5, w: 3.5, h: 3, align: "center", color: "999999" });

addRegularSlide("17. Advantages", 
    "This system provides multiple benefits to users and service providers.",
    ["Saves time and effort", "Easy access to services", "Reliable and secure system", "Transparent pricing"]);

addRegularSlide("18. Limitations", 
    "Despite its advantages, the system has some limitations.",
    ["Requires internet connection", "Service availability may vary", "Initial development cost"]);

addRegularSlide("19. Future Enhancements", 
    "The system can be further improved by adding advanced features.",
    ["Mobile application development", "AI-based recommendations", "Live tracking of service providers", "Chat and support system"]);

addRegularSlide("20. Conclusion", 
    "The system successfully simplifies home service booking.",
    ["Improves user convenience and satisfaction", "Provides a scalable and efficient online solution"]);

// 21. Thank You
let lastSlide = pres.addSlide();
lastSlide.background = { color: "1b2735" };
lastSlide.addText("Thank You", { x: 1, y: 2.2, w: 8, fontSize: 64, bold: true, color: "f1c40f", align: "center" });
lastSlide.addText("Questions?", { x: 1, y: 3.5, w: 8, fontSize: 24, color: "ffffff", align: "center" });
lastSlide.addText("Ashish John", { x: 1, y: 4.5, w: 8, fontSize: 16, color: "aaaaaa", align: "center" });

pres.writeFile({ fileName: "HomeService_Presentation.pptx" }).then(() => {
    console.log("PPTX Generation Complete");
});
