const nodemailer=require('nodemailer')
require('dotenv').config()

const verification=async(email,content,res)=>{
    try{
        const transporter=await nodemailer.createTransport({
            host:"smtp.gmail.com",
            port:587,
            secure:false,
            auth:{
                user:`${process.env.EMAIL}`,
                pass:`${process.env.PASSWORD}`
            }
        });
        let info=await transporter.sendMail({
            from:`${process.env.EMAIL}`,
            to:`${email}`,
            subject:'automated response',
            html: `${content}`
        })
        res.status(200).json({msg:'mail sent'})
    }
    catch(err)
    {
        res.status(400).json({error:err})
    }
}

module.exports={
    verification
}