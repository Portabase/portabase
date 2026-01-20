import nodemailer from "nodemailer";

export const createTransporter = (server: Server) => {
    const portNumber = Number(server.port);
    return nodemailer.createTransport({
        pool: true,
        host: server.host,
        port: portNumber,
        secure: server.secure ?? portNumber === 465,
        auth: {
            user: server.user,
            pass: server.pass,
        },
    });
};