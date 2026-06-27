// import * as React from "react";
// import EmailLayout from "./email-layout";
// import {Text, Section, Button} from "@react-email/components";
// import type {EventPayload} from "@/features/notifications/types";
//
// export interface EmailNotificationProps {
//     payload: EventPayload
// }
//
// export const EmailNotification = ({payload}: EmailNotificationProps) => {
//     return (
//         <EmailLayout preview={payload.title}>
//             <Text className="text-base  text-green-800 font-bold ">${payload.title}</Text>
//             <Text className="text-base  text-green-800 font-bold "><strong>Level:</strong> ${payload.level}</Text>
//
//
//             <Text className="text-base font-light  text-green-800 ">
//                 ${payload.message.replace(/\n/g, '<br>')}
//             </Text>{" "}
//
//
//             <Section className="mt-[32px] mb-[32px] text-center">
//
//             </Section>
//
//             {payload.data && (
//                 <Section className="mt-[16px] text-sm text-gray-700">
//                     <pre>{JSON.stringify(payload.data, null, 2)}</pre>
//                 </Section>
//             )}
//
//             <Text className="text-base font-light text-green-800 ">Regards,<br/>Portabase</Text>
//         </EmailLayout>
//     );
// };
//
// export default EmailNotification;


//       const html = `
//       <h2>${payload.title}</h2>
//       <p><strong>Level:</strong> ${payload.level}</p>
//       <p>${payload.message.replace(/\n/g, '<br>')}</p>
//       ${payload.data ? `<pre>${JSON.stringify(payload.data, null, 2)}</pre>` : ''}
//     `;
//

import * as React from "react";
import EmailLayout from "./email-layout";
import {Text, Section, Button} from "@react-email/components";
import type {EventPayload} from "@/features/notifications/types";

export interface EmailNotificationProps {
    payload: EventPayload;
}

export const EmailNotification = ({payload}: EmailNotificationProps) => {
    return (
        <EmailLayout preview={payload.message}>
            <Section>
                <Text className="text-xl font-bold ">
                    {payload.title}
                </Text>
                <Text className=" font-semibold ">
                    Level: {payload.level}
                </Text>
            </Section>

            {payload.message && (
                <Section className="mb-2">
                    <Text
                        className="text-base  font-light"
                        dangerouslySetInnerHTML={{__html: payload.message.replace(/\n/g, "<br>")}}
                    />
                </Section>
            )}

            {payload.data && (
                <Section className="mb-6 p-4 bg-gray-100 rounded text-sm text-gray-700">
                    <Text>
                        <pre>{JSON.stringify(payload.data, null, 2)}</pre>
                    </Text>
                </Section>
            )}

            <Section className="mt-8">
                <Text className="text-base font-light ">
                    Regards,
                    <br/>
                    Portabase
                </Text>
            </Section>
        </EmailLayout>
    );
};

export default EmailNotification;
