interface InstagramPostHeaderProps {
  pageNumber: number;
  totalPages: number;
}

export const InstagramPostHeader = ({ pageNumber, totalPages }: InstagramPostHeaderProps) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm px-12 py-8 text-center">
      <h1 className="text-white text-6xl font-bold mb-2">🌍 Hub de Viajes</h1>
      {totalPages > 1 && (
        <p className="text-white/80 text-lg mt-2">
          Página {pageNumber} de {totalPages}
        </p>
      )}
    </div>
  );
};