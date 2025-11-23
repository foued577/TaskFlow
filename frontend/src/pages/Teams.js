const loadTeams = async () => {
  try {
    setLoading(true);
    const response = await teamsAPI.getAll();
    setTeams(response.data.data || []);
  } catch (error) {
    console.error("Erreur détaillée:", error);
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Erreur lors du chargement des équipes";
    toast.error(errorMessage);
    
    // Si erreur d'authentification, rediriger vers login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    setTeams([]); // Initialiser avec un tableau vide
  } finally {
    setLoading(false);
  }
};
