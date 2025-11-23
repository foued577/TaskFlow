const loadData = async () => {
  try {
    setLoading(true);
    const [projectsRes, teamsRes] = await Promise.all([
      projectsAPI.getAll(),
      teamsAPI.getAll(),
    ]);

    const projects = projectsRes.data.data || [];
    const sortedProjects = projects.sort((a, b) =>
      a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
    );

    setProjects(sortedProjects);
    setTeams(teamsRes.data.data || []);
  } catch (error) {
    console.error("Erreur détaillée:", error);
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Erreur lors du chargement des projets";
    toast.error(errorMessage);
    
    // Si erreur d'authentification, rediriger vers login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    setProjects([]);
    setTeams([]);
  } finally {
    setLoading(false);
  }
};
