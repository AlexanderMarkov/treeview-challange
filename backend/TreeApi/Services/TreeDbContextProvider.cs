using Microsoft.EntityFrameworkCore;
using TreeApi.Models;

namespace TreeApi.Services
{
	public interface ITreeDbContextProvider
	{
		TreeDbContext CreateContext();
	}

	public class TreeDbContextProvider : ITreeDbContextProvider
	{
		private readonly DbContextOptions<TreeDbContext> _options;

		public TreeDbContextProvider(DbContextOptions<TreeDbContext> options)
		{
			_options = options;
		}

		public TreeDbContext CreateContext()
		{
			return new TreeDbContext(_options);
		}
	}
}
