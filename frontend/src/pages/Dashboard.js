const loadDashboardData = async () => {
  try {
    const [tasksRes, projectsRes, teamsRes, overdueRes] = await Promise.all([
      tasksAPI.getAll(),
      projectsAPI.getAll(),
      teamsAPI.getAll(),
      tasksAPI.getOverdue(),
    ]);

    const tasks = tasksRes.data.data || [];
    const overdueTasks = overdueRes.data.data || [];
    
    setStats({
      totalTasks: tasks.length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      overdue: overdueRes.data.count || overdueTasks.length,
    });

    setRecentTasks(tasks.slice(0, 5));
    setProjects((projectsRes.data.data || []).slice(0, 4));
    setTeams(teamsRes.data.data || []);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    // Initialiser avec des valeurs par défaut en cas d'erreur
    setStats({
      totalTasks: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    });
    setRecentTasks([]);
    setProjects([]);
    setTeams([]);
  } finally {
    setLoading(false);
  }
};
