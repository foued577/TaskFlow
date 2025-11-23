const User = require("../models/User");

// --------------------------------------------------------
// @desc    Get all users (ADMIN ONLY)
// @route   GET /api/users
// @access  Private/Admin
// --------------------------------------------------------
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des utilisateurs",
    });
  }
};

// --------------------------------------------------------
// @desc    Get a single user by ID (ADMIN ONLY)
// @route   GET /api/users/:id
// @access  Private/Admin
// --------------------------------------------------------
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'utilisateur",
    });
  }
};

// --------------------------------------------------------
// @desc    Update a user (ADMIN ONLY)
// @route   PUT /api/users/:id
// @access  Private/Admin
// --------------------------------------------------------
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive } = req.body;

    // admin peut changer rôle + désactiver utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        email,
        role,
        isActive,
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Utilisateur mis à jour",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
    });
  }
};

// --------------------------------------------------------
// @desc    Delete user (ADMIN ONLY)
// @route   DELETE /api/users/:id
// @access  Private/Admin
// --------------------------------------------------------
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé définitivement",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
    });
  }
};
