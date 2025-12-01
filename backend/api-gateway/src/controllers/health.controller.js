class HealthController {
    getHealth(req, res) {
        res.status(200).json({
            status: 'healthy',
            service: 'api-gateway',
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = new HealthController();