export default function InputDebug() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Input Focus Debug Test</h1>
      <p>Try typing in these native inputs - they should maintain focus:</p>
      <br />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input 
          id="debug1" 
          name="debug1" 
          type="text" 
          defaultValue="" 
          placeholder="Type a long sentence here..." 
          style={{ padding: 8, fontSize: 16 }}
        />
        <input 
          id="debug2" 
          name="debug2" 
          type="text" 
          defaultValue="" 
          placeholder="And another long sentence here..."
          style={{ padding: 8, fontSize: 16 }}
        />
        <textarea
          id="debug3"
          name="debug3"
          defaultValue=""
          placeholder="Type multiple lines here..."
          style={{ padding: 8, fontSize: 16, minHeight: 80 }}
        />
      </div>
    </div>
  );
}