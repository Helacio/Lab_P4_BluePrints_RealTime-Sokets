export default function AuthorPanel({ author, onAuthorChange, blueprints, onSelect, onRefresh, loading, error }) {
  const totalPoints = blueprints.reduce(
    (total, blueprint) => total + (blueprint.points?.length ?? 0),
    0,
  )

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label htmlFor="author">Autor:</label>
        <input
          id="author"
          value={author}
          onChange={(event) => onAuthorChange(event.target.value)}
          placeholder="autor"
        />
        <button onClick={onRefresh} disabled={loading}>
          {loading ? 'Cargando...' : 'Listar planos'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 4 }}>Plano</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 4 }}>Puntos</th>
            <th style={{ borderBottom: '1px solid #ddd', padding: 4 }} />
          </tr>
        </thead>
        <tbody>
          {blueprints.map((blueprint) => (
            <tr key={`${blueprint.author}/${blueprint.name}`}>
              <td style={{ padding: 4 }}>{blueprint.name}</td>
              <td style={{ textAlign: 'right', padding: 4 }}>{blueprint.points?.length ?? 0}</td>
              <td style={{ padding: 4 }}>
                <button onClick={() => onSelect(blueprint)}>Abrir</button>
              </td>
            </tr>
          ))}
        </tbody>
        {blueprints.length > 0 && (
          <tfoot>
            <tr>
              <td style={{ padding: 4, fontWeight: 'bold' }}>Total</td>
              <td style={{ textAlign: 'right', padding: 4, fontWeight: 'bold' }}>{totalPoints}</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
