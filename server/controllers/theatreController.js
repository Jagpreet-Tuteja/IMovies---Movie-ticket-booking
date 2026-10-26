const Theatre = require('../models/theatreModel');
const Show = require('../models/showModel');

exports.list = async (req, res) => {
  const filter = req.query.city ? { city: req.query.city } : {};
  res.json(await Theatre.find(filter).sort({ city: 1, name: 1 }));
};

exports.create = async (req, res) => {
  const { name, city, address, screens } = req.body;
  res.status(201).json(await Theatre.create({ name, city, address, screens }));
};

exports.update = async (req, res) => {
  const { name, city, address, screens } = req.body;
  const theatre = await Theatre.findByIdAndUpdate(
    req.params.id,
    { name, city, address, screens },
    { new: true, runValidators: true }
  );
  if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
  res.json(theatre);
};

exports.remove = async (req, res) => {
  if (await Show.exists({ theatre: req.params.id, startTime: { $gte: new Date() } })) {
    return res.status(400).json({ message: 'This theatre has upcoming shows. Delete those shows first.' });
  }
  const theatre = await Theatre.findByIdAndDelete(req.params.id);
  if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
  res.json({ message: 'Theatre deleted' });
};
