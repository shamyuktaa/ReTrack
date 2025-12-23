"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from "react-icons/fi";

interface DatePickerProps {
  date: string;
  setDate: (value: string) => void;
}

export default function DatePickerClient({ date, setDate }: DatePickerProps) {
  return (
    <div className="relative w-full">
      <DatePicker
        selected={date ? new Date(date) : null}
        onChange={(d) => setDate(d ? d.toISOString().split("T")[0] : "")}
        placeholderText="Select date"
        dateFormat="yyyy-MM-dd"
        className="
          w-full bg-gray-900 border border-gray-700 
          text-gray-300 rounded-xl px-4 py-3 pr-12 cursor-pointer
        "
        popperPlacement="bottom-start"
        calendarClassName="
          bg-gray-900 text-white border border-gray-700 
          rounded-xl p-3
        "
      />

      <FiCalendar
        className="absolute right-4 top-3.5 text-blue-400 pointer-events-none"
        size={20}
      />
    </div>
  );
}
