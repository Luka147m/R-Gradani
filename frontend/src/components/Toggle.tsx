import '../style/Toggle.css';



const Toggle = ({ isOn, handleToggle, id } : { isOn: boolean; handleToggle: () => void; id: string }) => {
  

return (
    <>
        <input
            checked={isOn}
            onChange={handleToggle}
            className="react-toggle-checkbox"
            id={`react-toggle-new-${id}`}
            type="checkbox"
        />
        <label
            style={{ background: isOn ? "var(--correct)" : undefined }}
            className="react-toggle-label"
            htmlFor={`react-toggle-new-${id}`}
        >
            <span className={`react-toggle-button`} />
        </label>
    </>
    );
}

export default Toggle;