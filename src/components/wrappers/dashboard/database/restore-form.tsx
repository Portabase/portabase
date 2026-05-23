// "use client";
//
// import { useState } from "react";
//
// import { DateTimePicker } from "@/components/common/day-time-picker";
// import { Button } from "@/components/ui/button";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { RestoreSchema } from "@/components/wrappers/dashboard/database/restore-form.schema";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { ComboBox } from "@/components/common/combobox";
// import { Label } from "@/components/ui/label";
//
// export type restoreFormProps = {
//     databaseToRestore: any;
//     databases: any[];
//     backups: any[];
// };
//
// export const RestoreForm = (props: restoreFormProps) => {
//     const { databaseToRestore, databases, backups } = props;
//
//     const backupLocations = [
//         {
//             value: "remote-file",
//             label: "Remote File",
//         },
//         {
//             value: "desktop-file",
//             label: "Desktop File",
//         },
//     ];
//
//     const executionModes = [
//         {
//             value: "immediate",
//             label: "Immediate",
//         },
//         {
//             value: "scheduled",
//             label: "Scheduled",
//         },
//     ];
//
//     const [selectedDatabaseId, setSelectedDatabaseId] = useState(databaseToRestore.id);
//
//     const filteredBackups = backups.filter((backup) => backup.databaseId == selectedDatabaseId);
//
//     const defaultValues = {
//         executionMode: "immediate" as const,
//         backupLocation: "remote-file" as const,
//     };
//
//     const form = useZodForm({
//         schema: RestoreSchema,
//         defaultValues: defaultValues,
//     });
//
//     const values = form.getValues();
//
//     return (
//         <div>
//             <Form
//                 form={form}
//                 onSubmit={async (values) => {
//                     console.log(values);
//                 }}
//             >
//                 <FormField
//                     control={form.control}
//                     name="backupLocation"
//                     render={({ field }) => (
//                         <FormItem>
//                             <FormLabel>Backup location</FormLabel>
//                             <Select onValueChange={field.onChange} defaultValue={field.value}>
//                                 <FormControl>
//                                     <SelectTrigger>
//                                         <SelectValue />
//                                     </SelectTrigger>
//                                 </FormControl>
//                                 <SelectContent>
//                                     {backupLocations.map((backupLocation, key) => (
//                                         <SelectItem key={key} value={backupLocation.value}>
//                                             {backupLocation.label}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                             <FormMessage />
//                         </FormItem>
//                     )}
//                 />
//
//                 {values.backupLocation == "remote-file" ? (
//                     <>
//                         <div className="flex flex-col">
//                             <Label>Database</Label>
//                             <ComboBox
//                                 values={databases.map((database) => ({ value: database.id, label: database.name }))}
//                                 onValueChange={setSelectedDatabaseId}
//                                 defaultValue={selectedDatabaseId}
//                                 searchField
//                             />
//                         </div>
//                         <FormField
//                             control={form.control}
//                             name="remoteBackup"
//                             render={({ field }) => (
//                                 <FormItem className="flex flex-col">
//                                     <FormLabel>Remote backup</FormLabel>
//                                     <ComboBoxFormItem
//                                         values={filteredBackups.map((backup) => ({
//                                             value: backup.id,
//                                             label: backup.createdAt.toString(),
//                                         }))}
//                                         {...field}
//                                     />
//                                     <FormMessage />
//                                 </FormItem>
//                             )}
//                         />
//                     </>
//                 ) : null}
//
//                 {values.backupLocation == "desktop-file" ? (
//                     <FormField
//                         control={form.control}
//                         name="uploadedBackupFile"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>File</FormLabel>
//                                 <FormControl>
//                                     <Input id="uploadedBackupFile" type="file" {...field} />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                 ) : null}
//
//                 <FormField
//                     control={form.control}
//                     name="executionMode"
//                     render={({ field }) => (
//                         <FormItem>
//                             <FormLabel>Execution mode</FormLabel>
//                             <Select onValueChange={field.onChange} defaultValue={field.value}>
//                                 <FormControl>
//                                     <SelectTrigger>
//                                         <SelectValue />
//                                     </SelectTrigger>
//                                 </FormControl>
//                                 <SelectContent>
//                                     {executionModes.map((executionMode, key) => (
//                                         <SelectItem key={key} value={executionMode.value}>
//                                             {executionMode.label}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                             <FormMessage />
//                         </FormItem>
//                     )}
//                 />
//
//                 {values.executionMode == "scheduled" ? (
//                     <FormField
//                         control={form.control}
//                         name="scheduledDatetime"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>Scheduled date</FormLabel>
//                                 <FormControl>
//                                     <DateTimePicker value={field.value} onSelect={field.onChange} />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                         )}
//                     />
//                 ) : null}
//
//                 <Button type="submit">Launch restore</Button>
//             </Form>
//         </div>
//     );
// };
