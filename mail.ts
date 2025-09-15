import mailer from "nodemailer";

const transport = mailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
     secure: false,
     auth:{
        user:process.env.EMAIL_USER || "hello@com",
        pass:process.env.EMAIL_PASS || "",

     } 
})
const data = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'); // Generate a 6-digit OTP
 const mail = async () => {
  const info = await transport.sendMail({
    from: 'hello@com',
    to: "workkanhadewangan@gmail.com",
    subject: "Hello ✔",
    text: `Hello world? here is your Otp from the otp service and now you can get the auth to use it if you are not user then remove it from 100 here is otp ${data}`, // plain‑text body
    html: "<b>Hello world?</b>", // HTML body

  bcc:"",
  
  });

  console.log("Message sent:", info.messageId," Data:", data);
}


const otp  = async (email:string)=>{
    const otp = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'); // Generate a 6-digit OTP
    const info = await transport.sendMail({
        from: 'hello@com',
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}. Please use this code to complete your authentication.`,
        html: `<b>Your OTP code is ${otp}. Please use this code to complete your authentication.</b>`,
    });
    console.log("OTP sent to:", email, "Message ID:", info.messageId);
}
otp("workkanhadewangan@gmail.com")
