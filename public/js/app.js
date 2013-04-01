angular.module('shiva', []).config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'artist-list.html',
            controller: Shiva.Controllers.ArtistList
        })
        .when('/:artistSlug', {
            templateUrl: 'artist-detail.html',
            controller: Shiva.Controllers.Artist
        })
        .when('/:artistSlug/:songSlug', {
            templateUrl: 'artist-detail.html',
            controller: Shiva.Controllers.Artist
        })
        .otherwise({redirectTo: '/'});
}]);
