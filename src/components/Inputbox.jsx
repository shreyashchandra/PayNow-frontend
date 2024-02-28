/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */

export const Inputbox = ({ lable, val, onChange }) => {
  return (
    <div className="flex flex-col ">
      <p className="text-lg text-gray-500 font-medium text-left py-2">
        {lable}
      </p>
      <input
        onChange={onChange}
        type="text"
        placeholder={val}
        className="border-sky-600 w-full px-2 py-1 border rounded "
      />
    </div>
  );
};
