import '../style/Toggle.css';



const Toggle = ({ isOn, handleToggle } : { isOn: boolean; handleToggle: () => void }) => {
  

return (
    <>
        <input
            checked={isOn}
            onChange={handleToggle}
            className="react-toggle-checkbox"
            id={`react-toggle-new`}
            type="checkbox"
        />
        <label
            className="react-toggle-label"
            htmlFor={`react-toggle-new`}
        >
            <span className={`react-toggle-button`} />
        </label>
    </>
    );
}

export default Toggle;