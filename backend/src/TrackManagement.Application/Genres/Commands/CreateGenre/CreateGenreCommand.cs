using System.Text.RegularExpressions;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TrackManagement.Application.Common.Interfaces;
using TrackManagement.Application.Common.Text;
using TrackManagement.Application.Genres.Dtos;
using TrackManagement.Domain.Entities;

namespace TrackManagement.Application.Genres.Commands.CreateGenre;

public sealed record CreateGenreCommand(string Name) : IRequest<CreateGenreResult>;

/// <summary><see cref="AlreadyExisted"/> lets the endpoint answer 200 rather than 201 on a match.</summary>
public sealed record CreateGenreResult(GenreDto Genre, bool AlreadyExisted);

public class CreateGenreCommandValidator : AbstractValidator<CreateGenreCommand>
{
    public CreateGenreCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(2, 100);
    }
}

public partial class CreateGenreCommandHandler(
    IApplicationDbContext context,
    IArabicAwareNormalizer normalizer) : IRequestHandler<CreateGenreCommand, CreateGenreResult>
{
    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRuns();


    public async Task<CreateGenreResult> Handle(CreateGenreCommand request, CancellationToken cancellationToken)
    {
        var normalizedKey = normalizer.Normalize(request.Name);

        var existing = await context.Genres
            .FirstOrDefaultAsync(g => g.NormalizedKey == normalizedKey, cancellationToken);

        if (existing is not null)
        {
            return new CreateGenreResult(new GenreDto(existing.Id, existing.Name), AlreadyExisted: true);
        }

        var genre = new Genre
        {
            Id = Guid.NewGuid(),
            // Whitespace is tidied; casing and letter forms are kept exactly as typed, since those
            // are the author's choice while a stray double space never is.
            Name = WhitespaceRuns().Replace(request.Name.Trim(), " "),
            NormalizedKey = normalizedKey
        };

        context.Genres.Add(genre);
        await context.SaveChangesAsync(cancellationToken);

        return new CreateGenreResult(new GenreDto(genre.Id, genre.Name), AlreadyExisted: false);
    }
}
